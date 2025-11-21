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
          const { URL } = require('url');
          const https = require('https');
          const http = require('http');

          // Base del backend; por defecto usar HTTP en :8081
          // Usar HTTPS con puerto 8081 por defecto (Render)
          const backendBase = process.env.BACKEND_URL || 'https://mi-tienda-backend-o9i7.onrender.com:8081';
          // Construir URL destino quitando el prefijo /api
          const backendUrl = backendBase + req.url.replace('/api', '');
          const target = new URL(backendUrl);

          const isHttps = target.protocol === 'https:';
          const httpLib = isHttps ? https : http;
          const agent = isHttps ? new https.Agent({ rejectUnauthorized: false }) : undefined;

          const options = {
            hostname: target.hostname,
            port: target.port || (isHttps ? 443 : 80),
            path: target.pathname + (target.search || ''),
            method: req.method,
            headers: {
              ...req.headers,
              'x-skip-auth': '1',
              'Cache-Control': 'no-cache',
              'Access-Control-Allow-Origin': '*'
            },
            agent,
          };

          const proxyReq = httpLib.request(options, (proxyRes) => {
            // Copiar headers de respuesta
            Object.keys(proxyRes.headers).forEach(key => {
              res.setHeader(key, proxyRes.headers[key]);
            });

            // Log detallado para respuestas con error
            const status = proxyRes.statusCode || 200;
            if (status >= 400) {
              const errChunks = [];
              proxyRes.on('data', (chunk) => errChunks.push(Buffer.from(chunk)));
              proxyRes.on('end', () => {
                const body = Buffer.concat(errChunks).toString('utf8');
                console.error(`Proxy backend ${status} for ${req.method} ${req.url} -> ${backendUrl}`, {
                  reqHeaders: { 'x-skip-auth': options.headers['x-skip-auth'] },
                  respHeaders: proxyRes.headers,
                  body,
                });
              });
            }

            // Agregar CORS headers adicionales
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Credentials', 'false');

            res.writeHead(status);
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
