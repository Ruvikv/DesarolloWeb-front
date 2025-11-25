// Utilidad para manejar AsyncStorage de forma segura en SSR
import AsyncStorage from '@react-native-async-storage/async-storage';

// Wrapper seguro para AsyncStorage que funciona en SSR
export const safeAsyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (value === null || value === undefined) {
        // Si el valor es inválido, eliminar la clave para evitar errores
        await AsyncStorage.removeItem(key);
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
    }
  }
};

export default safeAsyncStorage;