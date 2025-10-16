const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuración del proxy para desarrollo
if (process.env.NODE_ENV === 'development') {
  config.server = {
    ...config.server,
    enhanceMiddleware: (middleware, metroServer) => {
      return (req, res, next) => {
        // Configurar CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-skip-auth');
        res.setHeader('Access-Control-Allow-Credentials', 'false');
        
        // Manejar preflight OPTIONS requests
        if (req.method === 'OPTIONS') {
          res.writeHead(200);
          res.end();
          return;
        }
        
        // Proxy para peticiones /api
        if (req.url && req.url.startsWith('/api')) {
          const https = require('https');
          const url = require('url');
          
          // Redirigir al backend real
          const backendUrl = 'https://mi-tienda-backend-o9i7.onrender.com' + req.url.replace('/api', '');
          const parsedUrl = url.parse(backendUrl);
          
          const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || 443,
            path: parsedUrl.path,
            method: req.method,
            headers: {
              ...req.headers,
              'x-skip-auth': 'true',
              'Cache-Control': 'no-cache',
              'Access-Control-Allow-Origin': '*'
            }
          };
          
          const proxyReq = https.request(options, (proxyRes) => {
            // Copiar headers de respuesta
            Object.keys(proxyRes.headers).forEach(key => {
              res.setHeader(key, proxyRes.headers[key]);
            });
            
            // Agregar CORS headers adicionales
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Credentials', 'false');
            
            res.writeHead(proxyRes.statusCode || 200);
            proxyRes.pipe(res);
          });
          
          proxyReq.on('error', (err) => {
            console.error('Proxy error:', err);
            res.writeHead(500);
            res.end('Proxy error: ' + err.message);
          });
          
          // Enviar datos del request original
          if (req.method !== 'GET' && req.method !== 'HEAD') {
            req.pipe(proxyReq);
          } else {
            proxyReq.end();
          }
          
          return;
        }
        
        return middleware(req, res, next);
      };
    }
  };
}

module.exports = config;
