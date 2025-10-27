// config/api.js
// Usa EXPO_PUBLIC_API_BASE_URL si está definido. En web dev (localhost), usa el proxy local en 8084.
const detectWebDevProxy = () => {
  try {
    if (typeof window !== 'undefined') {
      const { hostname } = window.location;
      const port = window.location.port;
      // Expo Web en desarrollo corre en localhost (suele ser 8081, 8082 o 19006)
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:8084';
      }
      // Fallback específico por si se empaqueta sin hostname pero con puerto típico
      if (port === '8081' || port === '8082' || port === '19006') {
        return 'http://localhost:8084';
      }
    }
  } catch (_) {}
  return null;
};

const DEFAULT_BASE = 'https://mi-tienda-backend-o9i7.onrender.com';
const OVERRIDE_BASE = (typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_API_BASE_URL) || detectWebDevProxy() || DEFAULT_BASE;

export const API_CONFIG = {
  BASE_URL: OVERRIDE_BASE,
  TIMEOUT: 90000, // 90 segundos para cold starts de Render y descargas grandes
  HEADERS: {
    // No forzamos Content-Type aquí para evitar preflight innecesario
    Accept: 'application/json',
  }
};
