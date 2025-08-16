/*
 * Express server entry point for Electron app
 * This is a wrapper around the main aisheets server that configures it for Electron
 */

import 'dotenv/config';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import compression from 'compression';

// Import the Qwik app components
import { createQwikCity } from '@builder.io/qwik-city/middleware/node';
import qwikCityPlan from '@qwik-city-plan';
import { manifest } from '@qwik-client-manifest';
import render from '../aisheets/dist/entry.ssr.js';

// Directories where the static assets are located
const distDir = join(fileURLToPath(import.meta.url), '..', '..', 'aisheets', 'dist');
const buildDir = join(distDir, 'build');

// Allow for dynamic port
const PORT = process.env.PORT ?? 3000;

// Create the Qwik City Node middleware
const { router, notFound } = createQwikCity({
  render,
  qwikCityPlan,
  manifest,
});

// Create the express server
const app = express();

// Enable gzip compression
app.use(compression());

// Add CORS headers for Electron
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', electron: true });
});

// Ollama proxy endpoint (if needed)
app.use('/api/ollama', (req, res) => {
  const axios = require('axios');
  const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
  
  axios({
    method: req.method,
    url: `${ollamaHost}${req.url}`,
    data: req.body,
    responseType: 'stream'
  }).then(response => {
    response.data.pipe(res);
  }).catch(error => {
    res.status(error.response?.status || 500).json({
      error: error.message
    });
  });
});

// Static asset handlers
app.use('/build', express.static(buildDir, { immutable: true, maxAge: '1y' }));
app.use(express.static(distDir, { redirect: false }));

// Use Qwik City's page and endpoint request handler
app.use(router);

// Use Qwik City's 404 handler
app.use(notFound);

// Start the express server
const server = app.listen(PORT, () => {
  console.log(`Brain Cells server started: http://localhost:${PORT}/`);
});

// Export for Electron to manage
module.exports = server;