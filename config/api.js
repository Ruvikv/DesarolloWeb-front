// config/api.js
// Usa EXPO_PUBLIC_API_BASE_URL si está definido. Sin proxy: apunte directo a Render por defecto.
const detectWebDevProxy = () => null;

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
