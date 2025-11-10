// utils/networkUtils.js
import NetInfo from '@react-native-async-storage/async-storage';

// Verificar conexión de red
export const checkNetworkConnection = async () => {
  try {
    // En React Native Web, siempre asumimos que hay conexión
    // En una app nativa, usarías NetInfo.fetch()
    return true;
  } catch (error) {
    console.error('Error checking network:', error);
    return false;
  }
};

// Manejar errores de red
export const handleNetworkError = (error: any): string => {
  if (error.code === 'ECONNREFUSED' || error.code === 'NETWORK_ERROR') {
    return 'No se pudo conectar al servidor. Verifica tu conexión a internet.';
  }
  
  if (error.response) {
    const status = error.response.status;
    
    switch (status) {
      case 401:
        return 'Credenciales incorrectas. Verifica tu email y contraseña.';
      case 400:
        return error.response.data?.message || 'Datos inválidos.';
      case 404:
        return 'Servicio no encontrado.';
      case 500:
        return 'Error del servidor. Intenta más tarde.';
      default:
        return error.response.data?.message || `Error ${status}. Intenta nuevamente.`;
    }
  }
  
  if (error.request) {
    return 'Sin conexión al servidor. Verifica tu conexión a internet.';
  }
  
  return error.message || 'Error desconocido. Intenta nuevamente.';
};