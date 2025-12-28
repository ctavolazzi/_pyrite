/**
 * MISSION CONTROL CHARTS
 * ======================
 * Lightweight SVG chart generators.
 * No dependencies. Fast. Beautiful.
 * 
 * Charts:
 * - Donut (status distribution)
 * - Bar (comparisons)
 * - Line (progress over time)
 * - Sparkline (mini trends)
 * - Heatmap (activity)
 */

const Charts = {
  // Color palette - matches our theme
  colors: {
    completed: '#10b981',
    active: '#ff9d3d',
    in_progress: '#3b9eff',
    pending: '#e6a23c',
    paused: '#6b7280',
    blocked: '#ef4444',
    default: '#5c574f'
  },

  // ============================================================================
  // Donut Chart - Perfect for status distribution
  // ============================================================================

  donut(container, data, options = {}) {
    const {
      size = 120,
      thickness = 20,
      showLabels = true,
      showCenter = true,
      centerText = '',
      centerValue = ''
    } = options;

    const total = Object.values(data).reduce((a, b) => a + b, 0);
    if (total === 0) {
      container.innerHTML = this._emptyState('No data');
      return;
    }

    const cx = size / 2;
    const cy = size / 2;
    const radius = (size - thickness) / 2;
    const circumference = 2 * Math.PI * radius;

    let currentAngle = -90; // Start at top
    const segments = [];

    Object.entries(data).forEach(([status, count]) => {
      if (count === 0) return;
      
      const percent = count / total;
      const angle = percent * 360;
      const color = this.colors[status] || this.colors.default;
      
      segments.push({
        status,
        count,
        percent,
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
        color
      });
      
      currentAngle += angle;
    });

    const paths = segments.map((seg, i) => {
      const startRad = (seg.startAngle * Math.PI) / 180;
      const endRad = (seg.endAngle * Math.PI) / 180;
      
      const x1 = cx + radius * Math.cos(startRad);
      const y1 = cy + radius * Math.sin(startRad);
      const x2 = cx + radius * Math.cos(endRad);
      const y2 = cy + radius * Math.sin(endRad);
      
      const largeArc = seg.percent > 0.5 ? 1 : 0;
      
      return `
        <path
          d="M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z"
          fill="${seg.color}"
          class="chart-segment"
          data-status="${seg.status}"
          data-count="${seg.count}"
          style="--delay: ${i * 0.1}s"
        >
          <title>${seg.status}: ${seg.count} (${Math.round(seg.percent * 100)}%)</title>
        </path>
      `;
    }).join('');

    // Inner circle for donut effect
    const innerRadius = radius - thickness;

    container.innerHTML = `
      <svg viewBox="0 0 ${size} ${size}" class="chart-donut">
        <g class="chart-segments">${paths}</g>
        <circle cx="${cx}" cy="${cy}" r="${innerRadius}" fill="var(--bg-card)" />
        ${showCenter ? `
          <text x="${cx}" y="${cy - 8}" class="chart-center-value" text-anchor="middle">${centerValue || total}</text>
          <text x="${cx}" y="${cy + 10}" class="chart-center-text" text-anchor="middle">${centerText || 'Total'}</text>
        ` : ''}
      </svg>
      ${showLabels ? this._legend(segments) : ''}
    `;
  },

  // ============================================================================
  // Bar Chart - Horizontal bars
  // ============================================================================

  bar(container, data, options = {}) {
    const {
      height = 24,
      gap = 8,
      showValues = true,
      maxValue = null,
      animate = true
    } = options;

    const entries = Object.entries(data);
    const max = maxValue || Math.max(...entries.map(([, v]) => v), 1);
    
    if (entries.length === 0) {
      container.innerHTML = this._emptyState('No data');
      return;
    }

    const bars = entries.map(([label, value], i) => {
      const percent = (value / max) * 100;
      const color = this.colors[label] || this.colors.default;
      
      return `
        <div class="chart-bar-row" style="--delay: ${i * 0.05}s">
          <span class="chart-bar-label">${this._formatLabel(label)}</span>
          <div class="chart-bar-track">
            <div class="chart-bar-fill ${animate ? 'animate' : ''}" 
                 style="width: ${percent}%; background: ${color}"></div>
          </div>
          ${showValues ? `<span class="chart-bar-value">${value}</span>` : ''}
        </div>
      `;
    }).join('');

    container.innerHTML = `<div class="chart-bar">${bars}</div>`;
  },

  // ============================================================================
  // Line Chart - Progress over time
  // ============================================================================

  line(container, points, options = {}) {
    const {
      width = 200,
      height = 80,
      showDots = true,
      showArea = true,
      showGrid = true,
      color = '#ff9d3d',
      animate = true
    } = options;

    if (!points || points.length === 0) {
      container.innerHTML = this._emptyState('No data');
      return;
    }

    const padding = 10;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const values = points.map(p => typeof p === 'number' ? p : p.value);
    const maxVal = Math.max(...values, 1);
    const minVal = Math.min(...values, 0);
    const range = maxVal - minVal || 1;

    const getX = (i) => padding + (i / (points.length - 1)) * chartWidth;
    const getY = (v) => padding + chartHeight - ((v - minVal) / range) * chartHeight;

    // Build path
    const pathPoints = values.map((v, i) => `${getX(i)},${getY(v)}`);
    const linePath = `M ${pathPoints.join(' L ')}`;
    
    // Area path (for fill under line)
    const areaPath = `${linePath} L ${getX(points.length - 1)},${height - padding} L ${padding},${height - padding} Z`;

    // Grid lines
    const gridLines = showGrid ? `
      <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" class="chart-grid" />
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" class="chart-grid" />
    ` : '';

    // Dots
    const dots = showDots ? values.map((v, i) => `
      <circle cx="${getX(i)}" cy="${getY(v)}" r="3" class="chart-dot" style="--delay: ${i * 0.05}s">
        <title>${points[i].label || `Point ${i + 1}`}: ${v}</title>
      </circle>
    `).join('') : '';

    container.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" class="chart-line ${animate ? 'animate' : ''}">
        ${gridLines}
        ${showArea ? `<path d="${areaPath}" class="chart-area" style="fill: ${color}20" />` : ''}
        <path d="${linePath}" class="chart-line-path" style="stroke: ${color}" />
        ${dots}
      </svg>
    `;
  },

  // ============================================================================
  // Sparkline - Tiny inline chart
  // ============================================================================

  sparkline(container, values, options = {}) {
    const {
      width = 60,
      height = 20,
      color = '#ff9d3d',
      showEndDot = true
    } = options;

    if (!values || values.length < 2) {
      container.innerHTML = `<span class="chart-sparkline-empty">—</span>`;
      return;
    }

    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;

    const points = values.map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    container.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" class="chart-sparkline">
        <polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.5" />
        ${showEndDot ? `<circle cx="${width}" cy="${height - ((values[values.length - 1] - min) / range) * height}" r="2" fill="${color}" />` : ''}
      </svg>
    `;
  },

  // ============================================================================
  // Progress Ring - Circular progress
  // ============================================================================

  progressRing(container, percent, options = {}) {
    const {
      size = 80,
      thickness = 8,
      color = '#10b981',
      bgColor = 'var(--bg-primary)',
      showPercent = true,
      animate = true
    } = options;

    const radius = (size - thickness) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;

    container.innerHTML = `
      <svg viewBox="0 0 ${size} ${size}" class="chart-progress-ring ${animate ? 'animate' : ''}">
        <circle 
          cx="${size / 2}" 
          cy="${size / 2}" 
          r="${radius}" 
          fill="none" 
          stroke="${bgColor}" 
          stroke-width="${thickness}"
        />
        <circle 
          cx="${size / 2}" 
          cy="${size / 2}" 
          r="${radius}" 
          fill="none" 
          stroke="${color}" 
          stroke-width="${thickness}"
          stroke-linecap="round"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${animate ? circumference : offset}"
          transform="rotate(-90 ${size / 2} ${size / 2})"
          class="chart-progress-fill"
          style="--target-offset: ${offset}"
        />
        ${showPercent ? `
          <text x="${size / 2}" y="${size / 2}" class="chart-progress-text" text-anchor="middle" dy="0.35em">
            ${Math.round(percent)}%
          </text>
        ` : ''}
      </svg>
    `;

    // Trigger animation
    if (animate) {
      requestAnimationFrame(() => {
        const fill = container.querySelector('.chart-progress-fill');
        if (fill) fill.style.strokeDashoffset = offset;
      });
    }
  },

  // ============================================================================
  // Mini Stat Card
  // ============================================================================

  statCard(container, label, value, options = {}) {
    const {
      trend = null, // 'up', 'down', 'flat'
      trendValue = '',
      icon = '◈',
      color = 'var(--accent)'
    } = options;

    const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '';
    const trendClass = trend === 'up' ? 'trend-up' : trend === 'down' ? 'trend-down' : '';

    container.innerHTML = `
      <div class="chart-stat-card">
        <span class="chart-stat-icon" style="color: ${color}">${icon}</span>
        <div class="chart-stat-content">
          <span class="chart-stat-value">${value}</span>
          <span class="chart-stat-label">${label}</span>
        </div>
        ${trend ? `
          <span class="chart-stat-trend ${trendClass}">
            ${trendIcon} ${trendValue}
          </span>
        ` : ''}
      </div>
    `;
  },

  // ============================================================================
  // Activity Heatmap
  // ============================================================================

  heatmap(container, data, options = {}) {
    const {
      weeks = 12,
      cellSize = 10,
      gap = 2
    } = options;

    // data is array of { date, count }
    const maxCount = Math.max(...data.map(d => d.count), 1);
    
    // Group by week
    const cells = data.slice(-weeks * 7).map((d, i) => {
      const intensity = d.count / maxCount;
      const col = Math.floor(i / 7);
      const row = i % 7;
      
      return `
        <rect
          x="${col * (cellSize + gap)}"
          y="${row * (cellSize + gap)}"
          width="${cellSize}"
          height="${cellSize}"
          rx="2"
          fill="var(--accent)"
          opacity="${0.1 + intensity * 0.9}"
          class="chart-heatmap-cell"
        >
          <title>${d.date}: ${d.count} activities</title>
        </rect>
      `;
    }).join('');

    const width = weeks * (cellSize + gap);
    const height = 7 * (cellSize + gap);

    container.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" class="chart-heatmap">
        ${cells}
      </svg>
    `;
  },

  // ============================================================================
  // Helpers
  // ============================================================================

  _legend(segments) {
    return `
      <div class="chart-legend">
        ${segments.map(seg => `
          <div class="chart-legend-item">
            <span class="chart-legend-dot" style="background: ${seg.color}"></span>
            <span class="chart-legend-label">${this._formatLabel(seg.status)}</span>
            <span class="chart-legend-value">${seg.count}</span>
          </div>
        `).join('')}
      </div>
    `;
  },

  _formatLabel(label) {
    return label.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  },

  _emptyState(message) {
    return `<div class="chart-empty">${message}</div>`;
  }
};

// Export
window.Charts = Charts;

