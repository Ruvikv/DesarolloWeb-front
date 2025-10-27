// Simple dev proxy to bypass CORS for Expo Web during development
// Forwards all requests to the Render backend and adds permissive CORS headers

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const TARGET = process.env.TARGET_URL || 'https://mi-tienda-backend-o9i7.onrender.com';
const PORT = process.env.PORT || 8084;

const app = express();

// Basic CORS headers for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-skip-auth');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Health endpoint to verify proxy is running
app.get('/health', (req, res) => {
  res.json({ ok: true, target: TARGET });
});

// Proxy all other requests to backend
app.use(
  '/',
  createProxyMiddleware({
    target: TARGET,
    changeOrigin: true,
    ws: true,
    secure: true,
    onProxyReq: (proxyReq, req, res) => {
      // Ensure JSON content type for POST bodies when the client didn't set it
      if (req.method === 'POST' && !proxyReq.getHeader('Content-Type')) {
        proxyReq.setHeader('Content-Type', 'application/json');
      }
      // Pass through custom headers used by the app
      proxyReq.setHeader('x-skip-auth', req.headers['x-skip-auth'] || '1');
    },
    onError: (err, req, res) => {
      console.error('Proxy error:', err.message);
      res.status(502).json({ error: 'Proxy error', message: err.message });
    },
  })
);

app.listen(PORT, () => {
  console.log(`Dev proxy listening on http://localhost:${PORT}, forwarding to ${TARGET}`);
});