import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { safeAsyncStorage } from './storageUtils';
import { fetchWithTimeout } from './httpUtils';
import { API_CONFIG } from '../config/api.js';
import { Platform } from 'react-native';

// Configuración base de la API
// Configuración base de la API
const API_BASE_URL = API_CONFIG.BASE_URL;

// Crear instancia de axios para categorías
const categoriasClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_CONFIG.TIMEOUT || 30000,
});

// Interceptor para agregar token a las peticiones (omitir si x-skip-auth)
categoriasClient.interceptors.request.use(
  async (config) => {
    try {
      const headers = (config.headers = config.headers || {});
      const skipAuth = (headers as any)['x-skip-auth'] === '1' || (config as any).skipAuth === true;
      
      if (skipAuth) {
        // Para peticiones públicas, usar headers mínimos para evitar preflight
        config.headers = config.headers || {};
        config.headers['Accept'] = 'application/json';
      } else {
        const token = await safeAsyncStorage.getItem('authToken');
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        // No forzar Content-Type en GET para evitar preflight
        if ((config.method || 'get').toLowerCase() === 'get') {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { ['Content-Type']: _omit, ['content-type']: _omit2, ...rest } = headers as any;
          config.headers = rest;
        }
      }
    } catch (error) {
      console.error('Error al preparar request:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar respuestas y errores
categoriasClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await safeAsyncStorage.removeItem('authToken');
    }
    return Promise.reject(error);
  }
);

// Helper para extraer datos independientemente del formato
function extractData<T>(response: AxiosResponse<any>): T {
  const body = response.data;
  // Si la respuesta tiene estructura {data: ...}, extraer data
  if (body && typeof body === 'object' && 'data' in body && !Array.isArray(body)) {
    return body.data as T;
  }
  // Si es un array o un objeto directo, devolverlo tal como está
  return body as T;
}

// Interfaces para categorías
export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}



// Servicios de categorías
export const categoriasService = {
  obtenerTodas: async (): Promise<Categoria[]> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/categorias`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        mode: 'cors',
        timeoutMs: API_CONFIG.TIMEOUT,
      });
      
      if (!response.ok) {
        // Si el backend devuelve 404/401, degradar con lista vacía
        if (response.status === 404 || response.status === 401) {
          return [];
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const categorias: Categoria[] = await response.json();
      return categorias.filter(cat => cat.activo); // Solo categorías activas
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      // Degradar silenciosamente si fallo de red o CORS: devolver lista vacía
      return [];
    }
  },

  obtenerPorId: async (id: string): Promise<Categoria> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/categorias/${id}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        mode: 'cors',
        timeoutMs: API_CONFIG.TIMEOUT,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const categoria: Categoria = await response.json();
      return categoria;
    } catch (error) {
      console.error('Error al obtener categoría:', error);
      throw error;
    }
  }
};

export default categoriasClient;