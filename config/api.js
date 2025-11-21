// config/api.js
export const API_CONFIG = {
  // Lee la variable de entorno inyectada por Expo (.env) y permite override por build.
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://mi-tienda-backend-o9i7.onrender.com',
  TIMEOUT: 60000, // 60 segundos para cold starts
  HEADERS: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
};
