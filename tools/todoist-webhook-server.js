#!/usr/bin/env node
/**
 * Todoist Webhook Server
 *
 * Receives instant webhooks from Todoist when tasks are created/modified.
 * Creates work efforts immediately (no polling delay).
 *
 * Usage:
 *   node tools/todoist-webhook-server.js
 *
 * Environment:
 *   TODOIST_WEBHOOK_SECRET - Secret for validating webhook requests
 *   PORT - Server port (default: 3456)
 */

import express from 'express';
import crypto from 'crypto';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3456;
const WEBHOOK_SECRET = process.env.TODOIST_WEBHOOK_SECRET;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Verify webhook signature from Todoist
 */
function verifyWebhookSignature(payload, signature) {
  if (!WEBHOOK_SECRET) {
    console.warn('⚠️  TODOIST_WEBHOOK_SECRET not set - skipping signature verification');
    return true;
  }

  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  hmac.update(JSON.stringify(payload));
  const expectedSignature = hmac.digest('base64');

  return signature === expectedSignature;
}

/**
 * Process Todoist webhook event
 */
async function processWebhook(event) {
  console.log('\n📥 Webhook received:', event.event_name);

  // Filter for item:added events with 'pyrite' label
  if (event.event_name === 'item:added') {
    const task = event.event_data;
    const labels = task.labels || [];

    console.log('   Task:', task.content);
    console.log('   Labels:', labels.join(', '));

    if (labels.includes('pyrite')) {
      console.log('   ✓ Has "pyrite" label - creating work effort...');

      // Call Python plugin to create WE
      return new Promise((resolve, reject) => {
        const pythonScript = path.join(__dirname, '..', 'plugins', 'todoist', 'create_we_from_task.py');
        const process = spawn('python3', [pythonScript, '--task-id', task.id]);

        let output = '';
        let error = '';

        process.stdout.on('data', (data) => {
          output += data.toString();
          console.log('   ', data.toString().trim());
        });

        process.stderr.on('data', (data) => {
          error += data.toString();
        });

        process.on('close', (code) => {
          if (code === 0) {
            console.log('   ✅ Work effort created successfully!');
            resolve({ success: true, output });
          } else {
            console.error('   ❌ Failed to create work effort:', error);
            reject(new Error(error));
          }
        });
      });
    } else {
      console.log('   ⊘ No "pyrite" label - skipping');
    }
  }

  return { success: true, skipped: true };
}

/**
 * Webhook endpoint
 */
app.post('/webhook/todoist', async (req, res) => {
  const signature = req.headers['x-todoist-hmac-sha256'];
  const payload = req.body;

  console.log('\n' + '='.repeat(60));
  console.log('🔔 Incoming webhook from Todoist');
  console.log('   Time:', new Date().toISOString());

  // Verify signature
  if (!verifyWebhookSignature(payload, signature)) {
    console.error('   ❌ Invalid signature - rejecting');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  console.log('   ✓ Signature verified');

  try {
    // Process webhook
    await processWebhook(payload);

    // Respond to Todoist immediately (they timeout after 5 seconds)
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('   ❌ Error processing webhook:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Todoist Webhook Server Started');
  console.log('='.repeat(60));
  console.log(`   Port: ${PORT}`);
  console.log(`   Webhook URL: http://localhost:${PORT}/webhook/todoist`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log('\n⏳ Waiting for webhooks from Todoist...\n');

  if (!WEBHOOK_SECRET) {
    console.warn('⚠️  Warning: TODOIST_WEBHOOK_SECRET not set');
    console.warn('   Webhook signatures will not be verified (insecure!)');
    console.warn('   Set it with: export TODOIST_WEBHOOK_SECRET=your-secret\n');
  }
});

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down webhook server...');
  process.exit(0);
});
