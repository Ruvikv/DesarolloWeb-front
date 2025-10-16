// Utilidad para manejar AsyncStorage de forma segura en SSR
import AsyncStorage from '@react-native-async-storage/async-storage';

// Detectar si estamos en el servidor (SSR)
const isServer = typeof window === 'undefined';

// Wrapper seguro para AsyncStorage que funciona en SSR
export const safeAsyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (isServer) {
      console.log(`[safeAsyncStorage] getItem(${key}) - En servidor, retornando null`);
      return null; // En el servidor, siempre devolver null
    }
    try {
      const value = await AsyncStorage.getItem(key);
      console.log(`[safeAsyncStorage] getItem(${key}) - Valor obtenido:`, value ? `${value.length} chars, starts: ${value.substring(0, 20)}...` : 'null');
      return value;
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (isServer) {
      return; // En el servidor, no hacer nada
    }
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    if (isServer) {
      return; // En el servidor, no hacer nada
    }
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
    }
  }
};

export default safeAsyncStorage;