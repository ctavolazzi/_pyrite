# Phase 3: Intelligence & Analytics

**Version Target**: v0.8.0 - v0.9.0
**Duration**: 6-8 weeks
**Status**: Planning
**Priority**: P1 (High)
**Depends On**: Phase 2 (Performance & Database)

## Objectives

Transform Pyrite from a tracking tool into an intelligent development assistant:
1. Predictive completion estimates using historical data
2. Automated categorization and tagging with ML
3. Relationship graphs and dependency detection
4. Smart notifications and daily digests
5. Insights and recommendations engine

## Stage Breakdown

### Stage 1: Analytics Engine (Weeks 1-3) → v0.8.0-alpha.1

**Goal**: Build analytics foundation for deriving insights from work effort data

#### Data Model: Time Series Analytics

**File**: `mcp-servers/dashboard/lib/analytics/types.js`
```javascript
/**
 * @typedef {Object} TimeSeriesDataPoint
 * @property {number} timestamp - Unix timestamp
 * @property {number} value - Metric value
 * @property {Object} dimensions - Dimensional data (status, tags, etc.)
 */

/**
 * @typedef {Object} TrendAnalysis
 * @property {string} direction - 'up' | 'down' | 'stable'
 * @property {number} slope - Rate of change
 * @property {number} confidence - Confidence score (0-1)
 * @property {number[]} forecast - Next N predicted values
 */

/**
 * @typedef {Object} VelocityMetrics
 * @property {number} current - Current velocity (WE completed per week)
 * @property {number} average - Average velocity over period
 * @property {number} trend - Trend direction (-1, 0, 1)
 * @property {number} acceleration - Rate of velocity change
 */
```

#### Analytics Engine Core

**File**: `mcp-servers/dashboard/lib/analytics/engine.js`
```javascript
const { WorkEffortRepository } = require('../db/repository');

/**
 * Analytics Engine for deriving insights from work effort data
 */
class AnalyticsEngine {
  constructor(repository) {
    this.repo = repository;
  }

  /**
   * Calculate development velocity
   * Algorithm: Exponentially Weighted Moving Average (EWMA)
   *
   * EWMA gives more weight to recent data while considering history
   * Formula: S_t = α * X_t + (1 - α) * S_(t-1)
   * where α = smoothing factor (0.3 = 30% weight on new data)
   *
   * @param {Object} options
   * @param {number} options.windowDays - Analysis window in days (default: 30)
   * @param {number} options.alpha - Smoothing factor (default: 0.3)
   * @returns {VelocityMetrics}
   */
  calculateVelocity(options = {}) {
    const {
      windowDays = 30,
      alpha = 0.3
    } = options;

    // Get completed work efforts in window
    const since = Date.now() - (windowDays * 24 * 60 * 60 * 1000);
    const completed = this.repo.findCompleted({ since });

    // Group by week
    const byWeek = this.groupByWeek(completed);

    // Calculate EWMA
    let ewma = byWeek[0]?.count || 0;
    const ewmaValues = [ewma];

    for (let i = 1; i < byWeek.length; i++) {
      ewma = alpha * byWeek[i].count + (1 - alpha) * ewma;
      ewmaValues.push(ewma);
    }

    // Calculate trend using linear regression
    const trend = this.linearRegression(
      ewmaValues.map((v, i) => [i, v])
    );

    // Current velocity = most recent EWMA
    const current = ewmaValues[ewmaValues.length - 1];

    // Average over entire window
    const average = byWeek.reduce((sum, w) => sum + w.count, 0) / byWeek.length;

    // Acceleration = second derivative
    const acceleration = this.calculateAcceleration(ewmaValues);

    return {
      current: Math.round(current * 10) / 10,
      average: Math.round(average * 10) / 10,
      trend: trend.slope,
      acceleration: Math.round(acceleration * 100) / 100,
      forecast: this.forecastVelocity(ewmaValues, 4) // Next 4 weeks
    };
  }

  /**
   * Analyze work effort cycle time
   * Cycle time = time from 'planned' to 'completed'
   *
   * @returns {Object} Cycle time statistics
   */
  analyzeCycleTime() {
    const completed = this.repo.findCompleted({ limit: 100 });

    const cycleTimes = completed
      .filter(we => we.created_at && we.completed_at)
      .map(we => {
        const cycleMs = we.completed_at - we.created_at;
        return cycleMs / (1000 * 60 * 60 * 24); // Convert to days
      })
      .sort((a, b) => a - b);

    if (cycleTimes.length === 0) {
      return null;
    }

    return {
      count: cycleTimes.length,
      avg: this.average(cycleTimes),
      median: this.percentile(cycleTimes, 50),
      p75: this.percentile(cycleTimes, 75),
      p90: this.percentile(cycleTimes, 90),
      min: cycleTimes[0],
      max: cycleTimes[cycleTimes.length - 1]
    };
  }

  /**
   * Detect work effort patterns
   * Uses clustering to find similar work efforts
   *
   * Algorithm: K-Means Clustering on feature vectors
   * Features: ticket count, cycle time, progress velocity, size
   *
   * @param {number} k - Number of clusters (default: 3)
   * @returns {Object[]} Clusters with patterns
   */
  detectPatterns(k = 3) {
    const workEfforts = this.repo.findAll({ limit: 500 });

    // Extract features
    const features = workEfforts.map(we => this.extractFeatures(we));

    // Normalize features to [0, 1]
    const normalized = this.normalizeFeatures(features);

    // K-Means clustering
    const clusters = this.kMeans(normalized, k);

    // Interpret clusters
    return clusters.map((cluster, idx) => {
      const centroid = cluster.centroid;
      const members = cluster.members;

      return {
        id: idx,
        size: members.length,
        pattern: this.interpretCluster(centroid),
        examples: members.slice(0, 5).map(m => workEfforts[m].id)
      };
    });
  }

  /**
   * Extract features from work effort for ML
   * @param {Object} we - Work effort
   * @returns {number[]} Feature vector
   */
  extractFeatures(we) {
    const ticketCount = we.tickets?.length || 0;
    const cycleTime = we.completed_at
      ? (we.completed_at - we.created_at) / (1000 * 60 * 60 * 24)
      : 0;
    const progressVelocity = we.progress / (cycleTime || 1);

    // Estimate size from title/description length
    const size = (we.title?.length || 0) + (we.description?.length || 0);

    return [
      ticketCount,
      cycleTime,
      progressVelocity,
      size
    ];
  }

  /**
   * K-Means clustering algorithm
   * Time Complexity: O(n * k * i) where i = iterations
   *
   * @param {number[][]} data - Feature vectors
   * @param {number} k - Number of clusters
   * @param {number} maxIterations - Max iterations (default: 100)
   * @returns {Object[]} Clusters
   */
  kMeans(data, k, maxIterations = 100) {
    // Initialize centroids randomly
    let centroids = this.initializeCentroids(data, k);
    let assignments = new Array(data.length).fill(0);
    let converged = false;
    let iteration = 0;

    while (!converged && iteration < maxIterations) {
      // Assign points to nearest centroid
      const newAssignments = data.map(point =>
        this.nearestCentroid(point, centroids)
      );

      // Check convergence
      converged = newAssignments.every((a, i) => a === assignments[i]);
      assignments = newAssignments;

      // Recalculate centroids
      centroids = this.recalculateCentroids(data, assignments, k);

      iteration++;
    }

    // Build clusters
    const clusters = new Array(k).fill(null).map(() => ({
      centroid: [],
      members: []
    }));

    data.forEach((point, idx) => {
      const clusterIdx = assignments[idx];
      clusters[clusterIdx].members.push(idx);
    });

    centroids.forEach((centroid, idx) => {
      clusters[idx].centroid = centroid;
    });

    return clusters;
  }

  /**
   * Calculate Euclidean distance between two points
   * @param {number[]} a
   * @param {number[]} b
   * @returns {number}
   */
  euclideanDistance(a, b) {
    return Math.sqrt(
      a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0)
    );
  }

  /**
   * Find nearest centroid index
   * @param {number[]} point
   * @param {number[][]} centroids
   * @returns {number}
   */
  nearestCentroid(point, centroids) {
    let minDist = Infinity;
    let nearest = 0;

    centroids.forEach((centroid, idx) => {
      const dist = this.euclideanDistance(point, centroid);
      if (dist < minDist) {
        minDist = dist;
        nearest = idx;
      }
    });

    return nearest;
  }

  /**
   * Linear regression using least squares
   * @param {number[][]} points - Array of [x, y] points
   * @returns {Object} {slope, intercept, r2}
   */
  linearRegression(points) {
    const n = points.length;
    const sumX = points.reduce((sum, p) => sum + p[0], 0);
    const sumY = points.reduce((sum, p) => sum + p[1], 0);
    const sumXY = points.reduce((sum, p) => sum + p[0] * p[1], 0);
    const sumXX = points.reduce((sum, p) => sum + p[0] * p[0], 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R²
    const yMean = sumY / n;
    const ssTotal = points.reduce((sum, p) => sum + Math.pow(p[1] - yMean, 2), 0);
    const ssRes = points.reduce((sum, p) => {
      const predicted = slope * p[0] + intercept;
      return sum + Math.pow(p[1] - predicted, 2);
    }, 0);
    const r2 = 1 - (ssRes / ssTotal);

    return { slope, intercept, r2 };
  }

  // Helper methods
  groupByWeek(workEfforts) {
    // Implementation
  }

  calculateAcceleration(values) {
    // Second derivative approximation
    if (values.length < 3) return 0;

    const recent = values.slice(-3);
    const firstDerivative = [
      recent[1] - recent[0],
      recent[2] - recent[1]
    ];

    return firstDerivative[1] - firstDerivative[0];
  }

  forecastVelocity(ewmaValues, periods) {
    const trend = this.linearRegression(
      ewmaValues.map((v, i) => [i, v])
    );

    const forecast = [];
    const lastIdx = ewmaValues.length - 1;

    for (let i = 1; i <= periods; i++) {
      const predicted = trend.slope * (lastIdx + i) + trend.intercept;
      forecast.push(Math.max(0, Math.round(predicted * 10) / 10));
    }

    return forecast;
  }

  percentile(sortedValues, p) {
    const index = (p / 100) * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
  }

  average(values) {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  normalizeFeatures(features) {
    // Min-max normalization to [0, 1]
    const dimensions = features[0].length;
    const normalized = [];

    for (let d = 0; d < dimensions; d++) {
      const values = features.map(f => f[d]);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min || 1;

      features.forEach((f, i) => {
        if (!normalized[i]) normalized[i] = [];
        normalized[i][d] = (f[d] - min) / range;
      });
    }

    return normalized;
  }

  initializeCentroids(data, k) {
    // K-means++ initialization for better results
    const centroids = [];
    centroids.push(data[Math.floor(Math.random() * data.length)]);

    while (centroids.length < k) {
      const distances = data.map(point => {
        const minDist = Math.min(
          ...centroids.map(c => this.euclideanDistance(point, c))
        );
        return minDist * minDist; // Squared distance
      });

      const sum = distances.reduce((a, b) => a + b, 0);
      const probabilities = distances.map(d => d / sum);

      // Weighted random selection
      const rand = Math.random();
      let cumulative = 0;

      for (let i = 0; i < probabilities.length; i++) {
        cumulative += probabilities[i];
        if (rand <= cumulative) {
          centroids.push(data[i]);
          break;
        }
      }
    }

    return centroids;
  }

  recalculateCentroids(data, assignments, k) {
    const centroids = [];

    for (let i = 0; i < k; i++) {
      const clusterPoints = data.filter((_, idx) => assignments[idx] === i);

      if (clusterPoints.length === 0) {
        // Keep old centroid if cluster is empty
        centroids.push(this.centroids[i]);
        continue;
      }

      const dimensions = data[0].length;
      const centroid = new Array(dimensions).fill(0);

      clusterPoints.forEach(point => {
        point.forEach((val, d) => {
          centroid[d] += val;
        });
      });

      centroids.push(centroid.map(sum => sum / clusterPoints.length));
    }

    return centroids;
  }

  interpretCluster(centroid) {
    // Interpret normalized centroid features
    const [ticketCount, cycleTime, velocity, size] = centroid;

    if (ticketCount > 0.7 && cycleTime > 0.7) {
      return 'Large, complex work efforts';
    } else if (velocity > 0.8) {
      return 'Quick wins';
    } else if (cycleTime > 0.6 && velocity < 0.3) {
      return 'Long-running projects';
    } else {
      return 'Standard work efforts';
    }
  }
}

module.exports = { AnalyticsEngine };
```

---

### Stage 2: Predictive Features (Weeks 4-6) → v0.8.0-alpha.2

**Goal**: Predict completion times and proactively identify risks

#### Completion Predictor

**File**: `mcp-servers/dashboard/lib/analytics/predictor.js`
```javascript
/**
 * Predictive completion time estimator
 * Uses ensemble of algorithms for robust predictions
 */
class CompletionPredictor {
  constructor(analyticsEngine) {
    this.analytics = analyticsEngine;
  }

  /**
   * Predict completion time for work effort
   * Ensemble of 3 algorithms:
   * 1. Historical average (baseline)
   * 2. Similar work efforts (k-NN)
   * 3. Progress-based extrapolation
   *
   * @param {Object} workEffort
   * @returns {Object} Prediction with confidence interval
   */
  predictCompletion(workEffort) {
    const predictions = [
      this.predictByHistoricalAverage(workEffort),
      this.predictBySimilarity(workEffort),
      this.predictByProgress(workEffort)
    ];

    // Weighted ensemble (weights based on confidence)
    const weights = [0.3, 0.5, 0.2]; // k-NN gets highest weight
    const weightedPrediction = predictions.reduce((sum, pred, i) =>
      sum + pred.days * weights[i], 0
    );

    // Calculate confidence interval using standard deviation
    const variance = predictions.reduce((sum, pred, i) =>
      sum + weights[i] * Math.pow(pred.days - weightedPrediction, 2), 0
    );
    const stdDev = Math.sqrt(variance);

    return {
      estimatedDays: Math.round(weightedPrediction),
      confidence: this.calculateConfidence(predictions, stdDev),
      range: {
        min: Math.max(0, Math.round(weightedPrediction - 1.96 * stdDev)),
        max: Math.round(weightedPrediction + 1.96 * stdDev)
      },
      completionDate: new Date(Date.now() + weightedPrediction * 24 * 60 * 60 * 1000)
    };
  }

  /**
   * Predict using historical average cycle time
   * @param {Object} we
   * @returns {Object}
   */
  predictByHistoricalAverage(we) {
    const cycleTimeStats = this.analytics.analyzeCycleTime();

    if (!cycleTimeStats) {
      return { days: 7, confidence: 0.3 }; // Default fallback
    }

    // Use median for robustness to outliers
    const elapsed = (Date.now() - we.created_at) / (1000 * 60 * 60 * 24);
    const remaining = Math.max(0, cycleTimeStats.median - elapsed);

    return {
      days: remaining,
      confidence: 0.6
    };
  }

  /**
   * Predict using k-Nearest Neighbors on similar work efforts
   * Algorithm: k-NN with weighted voting
   *
   * @param {Object} we
   * @param {number} k - Number of neighbors (default: 5)
   * @returns {Object}
   */
  predictBySimilarity(we, k = 5) {
    const completed = this.analytics.repo.findCompleted({ limit: 100 });

    // Extract features
    const weFeatures = this.analytics.extractFeatures(we);

    // Calculate distances to all completed work efforts
    const distances = completed.map(completedWe => {
      const features = this.analytics.extractFeatures(completedWe);
      const distance = this.analytics.euclideanDistance(weFeatures, features);

      const cycleTime = (completedWe.completed_at - completedWe.created_at) /
        (1000 * 60 * 60 * 24);

      return { distance, cycleTime };
    });

    // Sort by distance and take k nearest
    distances.sort((a, b) => a.distance - b.distance);
    const kNearest = distances.slice(0, k);

    // Weighted average (closer neighbors have more weight)
    const totalWeight = kNearest.reduce((sum, n) =>
      sum + (1 / (n.distance + 0.1)), 0
    );

    const weightedCycleTime = kNearest.reduce((sum, n) =>
      sum + n.cycleTime * (1 / (n.distance + 0.1)), 0
    ) / totalWeight;

    const elapsed = (Date.now() - we.created_at) / (1000 * 60 * 60 * 24);
    const remaining = Math.max(0, weightedCycleTime - elapsed);

    return {
      days: remaining,
      confidence: 0.8 // k-NN typically reliable
    };
  }

  /**
   * Predict based on current progress velocity
   * @param {Object} we
   * @returns {Object}
   */
  predictByProgress(we) {
    const elapsed = (Date.now() - we.created_at) / (1000 * 60 * 60 * 24);
    const progressRate = we.progress / elapsed;

    if (progressRate === 0 || !isFinite(progressRate)) {
      return { days: 7, confidence: 0.2 };
    }

    const remaining = (100 - we.progress) / progressRate;

    return {
      days: remaining,
      confidence: we.progress > 20 ? 0.7 : 0.4 // More confident with more progress
    };
  }

  /**
   * Calculate overall prediction confidence
   * @param {Object[]} predictions
   * @param {number} stdDev
   * @returns {number} Confidence score (0-1)
   */
  calculateConfidence(predictions, stdDev) {
    // Lower std dev = higher confidence
    const varianceScore = Math.max(0, 1 - (stdDev / 10));

    // Average individual confidences
    const avgConfidence = predictions.reduce((sum, p) =>
      sum + p.confidence, 0
    ) / predictions.length;

    return Math.round((varianceScore * 0.6 + avgConfidence * 0.4) * 100) / 100;
  }

  /**
   * Identify at-risk work efforts
   * Risk factors:
   * - Predicted completion > 2x historical average
   * - Progress stalled (no updates in 7 days)
   * - Blocked status
   *
   * @returns {Object[]} At-risk work efforts with risk scores
   */
  identifyRisks() {
    const inProgress = this.analytics.repo.findByStatus('in-progress');
    const cycleTimeStats = this.analytics.analyzeCycleTime();

    return inProgress
      .map(we => {
        const prediction = this.predictCompletion(we);
        const elapsed = (Date.now() - we.created_at) / (1000 * 60 * 60 * 24);
        const daysSinceUpdate = (Date.now() - we.updated_at) / (1000 * 60 * 60 * 24);

        let riskScore = 0;

        // Risk: Taking much longer than expected
        if (elapsed > cycleTimeStats.p75 * 1.5) {
          riskScore += 30;
        }

        // Risk: Stalled progress
        if (daysSinceUpdate > 7) {
          riskScore += 40;
        }

        // Risk: Blocked
        if (we.status === 'blocked') {
          riskScore += 50;
        }

        // Risk: Low prediction confidence
        if (prediction.confidence < 0.5) {
          riskScore += 20;
        }

        return {
          workEffort: we,
          riskScore: Math.min(100, riskScore),
          riskLevel: riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low',
          reasons: this.identifyRiskReasons(we, elapsed, daysSinceUpdate, prediction)
        };
      })
      .filter(r => r.riskScore > 40)
      .sort((a, b) => b.riskScore - a.riskScore);
  }

  identifyRiskReasons(we, elapsed, daysSinceUpdate, prediction) {
    const reasons = [];

    if (we.status === 'blocked') {
      reasons.push('Work effort is currently blocked');
    }

    if (daysSinceUpdate > 7) {
      reasons.push(`No updates in ${Math.round(daysSinceUpdate)} days`);
    }

    if (prediction.confidence < 0.5) {
      reasons.push('Uncertain completion timeline');
    }

    return reasons;
  }
}

module.exports = { CompletionPredictor };
```

---

### Stage 3: ML Integration (Weeks 7-9) → v0.9.0

**Goal**: Automated tagging and categorization using machine learning

#### Auto-Tagger with TF-IDF

**File**: `mcp-servers/dashboard/lib/ml/auto-tagger.js`
```javascript
/**
 * Automatic tagging using TF-IDF and cosine similarity
 * No external ML library needed - pure JS implementation
 */
class AutoTagger {
  constructor() {
    this.vocabulary = new Map(); // Word -> document frequency
    this.documentCount = 0;
    this.tagModels = new Map(); // Tag -> TF-IDF vector
  }

  /**
   * Train on historical work efforts
   * @param {Object[]} workEfforts - Training data
   */
  train(workEfforts) {
    this.documentCount = workEfforts.length;

    // Build vocabulary and document frequencies
    workEfforts.forEach(we => {
      const words = this.tokenize(we.title + ' ' + (we.description || ''));
      const uniqueWords = new Set(words);

      uniqueWords.forEach(word => {
        this.vocabulary.set(word, (this.vocabulary.get(word) || 0) + 1);
      });
    });

    // Build TF-IDF vectors for each tag
    const workEffortsByTag = this.groupByTags(workEfforts);

    workEffortsByTag.forEach((wes, tag) => {
      const tfidfVector = this.buildTFIDFVector(wes);
      this.tagModels.set(tag, tfidfVector);
    });
  }

  /**
   * Predict tags for new work effort
   * @param {Object} we
   * @param {number} threshold - Minimum similarity (0-1)
   * @returns {Object[]} Predicted tags with confidence
   */
  predict(we, threshold = 0.3) {
    const weVector = this.buildTFIDFVector([we]);
    const predictions = [];

    this.tagModels.forEach((tagVector, tag) => {
      const similarity = this.cosineSimilarity(weVector, tagVector);

      if (similarity >= threshold) {
        predictions.push({
          tag,
          confidence: Math.round(similarity * 100) / 100
        });
      }
    });

    return predictions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Build TF-IDF vector for documents
   * @param {Object[]} documents
   * @returns {Map} Word -> TF-IDF score
   */
  buildTFIDFVector(documents) {
    const vector = new Map();

    // Calculate term frequencies
    const termFreqs = new Map();
    const totalTerms = documents.reduce((sum, doc) => {
      const words = this.tokenize(doc.title + ' ' + (doc.description || ''));
      words.forEach(word => {
        termFreqs.set(word, (termFreqs.get(word) || 0) + 1);
      });
      return sum + words.length;
    }, 0);

    // Calculate TF-IDF for each term
    termFreqs.forEach((count, word) => {
      const tf = count / totalTerms;
      const df = this.vocabulary.get(word) || 1;
      const idf = Math.log(this.documentCount / df);
      const tfidf = tf * idf;

      vector.set(word, tfidf);
    });

    return vector;
  }

  /**
   * Calculate cosine similarity between vectors
   * @param {Map} vec1
   * @param {Map} vec2
   * @returns {number} Similarity score (0-1)
   */
  cosineSimilarity(vec1, vec2) {
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    // Calculate dot product and magnitudes
    vec1.forEach((value, word) => {
      mag1 += value * value;
      const vec2Value = vec2.get(word) || 0;
      dotProduct += value * vec2Value;
    });

    vec2.forEach((value) => {
      mag2 += value * value;
    });

    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);

    if (mag1 === 0 || mag2 === 0) return 0;

    return dotProduct / (mag1 * mag2);
  }

  /**
   * Tokenize text into words
   * @param {string} text
   * @returns {string[]}
   */
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2) // Remove short words
      .filter(word => !this.isStopWord(word));
  }

  /**
   * Check if word is a stop word
   * @param {string} word
   * @returns {boolean}
   */
  isStopWord(word) {
    const stopWords = new Set([
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all',
      'can', 'has', 'was', 'one', 'our', 'out', 'this', 'that'
    ]);
    return stopWords.has(word);
  }

  groupByTags(workEfforts) {
    const byTag = new Map();

    workEfforts.forEach(we => {
      (we.tags || []).forEach(tag => {
        if (!byTag.has(tag)) {
          byTag.set(tag, []);
        }
        byTag.get(tag).push(we);
      });
    });

    return byTag;
  }
}

module.exports = { AutoTagger };
```

## API Endpoints

**File**: `mcp-servers/dashboard/routes/analytics.js`
```javascript
const express = require('express');
const router = express.Router();

// GET /api/analytics/velocity
router.get('/velocity', async (req, res) => {
  const { windowDays = 30 } = req.query;
  const velocity = req.analytics.calculateVelocity({ windowDays });
  res.json({ velocity });
});

// GET /api/analytics/predict/:workEffortId
router.get('/predict/:workEffortId', async (req, res) => {
  const we = req.repo.findById(req.params.workEffortId);
  const prediction = req.predictor.predictCompletion(we);
  res.json({ prediction });
});

// GET /api/analytics/risks
router.get('/risks', async (req, res) => {
  const risks = req.predictor.identifyRisks();
  res.json({ risks });
});

// POST /api/analytics/auto-tag
router.post('/auto-tag', async (req, res) => {
  const { workEffortId } = req.body;
  const we = req.repo.findById(workEffortId);
  const tags = req.autoTagger.predict(we);
  res.json({ suggestedTags: tags });
});

module.exports = router;
```

## Success Metrics

- [ ] 90%+ prediction accuracy within ±3 days
- [ ] Auto-tagging achieves 50%+ adoption rate
- [ ] Risk identification reduces overdue WEs by 30%
- [ ] Velocity tracking provides actionable insights
- [ ] Analytics queries complete in <200ms

## Next Steps

Proceed to [Phase 4: Platform & Ecosystem](../phase-4-platform/README.md).
