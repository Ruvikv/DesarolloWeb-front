// config/api.js
// Usa EXPO_PUBLIC_API_BASE_URL si está definido. En web dev (puerto 8082), usa el proxy local en 8084.
const detectWebDevProxy = () => {
  try {
    // When bundling for web, window is present
    if (typeof window !== 'undefined') {
      const port = window.location.port;
      if (port === '8082') return 'http://localhost:8084';
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
