import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api.js';

// Configuración base de la API
const API_BASE_URL = API_CONFIG.BASE_URL;

// Crear instancia de axios
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  // No establecer headers globales que disparen preflight en GET
});

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

// Interceptor para agregar token a las peticiones (omitir si x-skip-auth)
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const headers = (config.headers = config.headers || {});
      const skipAuth = (headers as any)['x-skip-auth'] === '1' || (config as any).skipAuth === true;
      
      if (skipAuth) {
        // Para peticiones públicas, usar headers mínimos para evitar preflight
        config.headers = config.headers || {};
        config.headers['Accept'] = 'application/json';
      } else {
        const token = await AsyncStorage.getItem('authToken');
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
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('authToken');
    }
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('authToken');
    }
    return Promise.reject(error);
  }
);

// Interfaces para tipado
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price?: number;
  image: string;
  category: string;
  stock: number;
  precios_productos?: { precio_final: number }[];
}

// Interfaz para la respuesta del backend
interface BackendProduct {
  id: string;
  nombre: string;
  descripcion: string;
  precio_final?: number;
  imagen_principal?: string;
  imagen?: string;
  categoria: string;
  stock: number;
  precios_productos?: { precio_final: number }[];
}

// Helper para mapear productos del backend al frontend
function mapBackendProduct(backendProduct: BackendProduct): Product {
  return {
    id: backendProduct.id,
    name: backendProduct.nombre,
    description: backendProduct.descripcion,
    price: backendProduct.precio_final ?? backendProduct.precios_productos?.[0]?.precio_final,
    image: backendProduct.imagen_principal || backendProduct.imagen || '',
    category: backendProduct.categoria,
    stock: backendProduct.stock
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Los servicios de autenticación se han movido a authService.ts

// Los servicios de productos se han movido a catalogoService.ts

// Servicio genérico para otras peticiones
export const apiService = {
  get: async <T>(url: string, config: any = {}): Promise<T> => {
    try {
      const response = await apiClient.get(url, config);
      return extractData<T>(response);
    } catch (error) {
      console.error(`Error en GET ${url}:`, error);
      throw error;
    }
  },

  post: async <T>(url: string, data: any, config: any = {}): Promise<T> => {
    try {
      const response = await apiClient.post(url, data, {
        headers: { 'Content-Type': 'application/json', ...(config.headers || {}) },
        ...config,
      });
      return extractData<T>(response);
    } catch (error) {
      console.error(`Error en POST ${url}:`, error);
      throw error;
    }
  },

  put: async <T>(url: string, data: any, config: any = {}): Promise<T> => {
    try {
      const response = await apiClient.put(url, data, {
        headers: { 'Content-Type': 'application/json', ...(config.headers || {}) },
        ...config,
      });
      return extractData<T>(response);
    } catch (error) {
      console.error(`Error en PUT ${url}:`, error);
      throw error;
    }
  },

  delete: async <T>(url: string, config: any = {}): Promise<T> => {
    try {
      const response = await apiClient.delete(url, config);
      return extractData<T>(response);
    } catch (error) {
      console.error(`Error en DELETE ${url}:`, error);
      throw error;
    }
  }
};

// ---------------- Geolocalización ----------------
export interface Coordinates { lat: number; lng: number }
export interface NearbyStore {
  id?: string;
  nombre?: string;
  direccion?: string;
  lat: number;
  lng: number;
  distanciaKm?: number;
  [key: string]: any;
}

export const geolocationService = {
  getCoordinatesFromAddress: async (direccion: string): Promise<Coordinates> => {
    try {
      const response = await apiClient.get<ApiResponse<Coordinates>>('/geolocalizacion/coordenadas', {
        params: { direccion },
      });
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener coordenadas desde dirección:', error);
      throw error;
    }
  },

  getAddressFromCoordinates: async (lat: number, lng: number): Promise<{ direccion: string }> => {
    try {
      const response = await apiClient.get<ApiResponse<{ direccion: string }>>('/geolocalizacion/direccion', {
        params: { lat, lng },
      });
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener dirección desde coordenadas:', error);
      throw error;
    }
  },

  calculateShippingCost: async (direccion: string, costoBase: number): Promise<{ costo: number; moneda?: string }> => {
    try {
      const response = await apiClient.get<ApiResponse<{ costo: number; moneda?: string }>>('/geolocalizacion/envio', {
        params: { direccion, costoBase },
      });
      return response.data.data;
    } catch (error) {
      console.error('Error al calcular costo de envío:', error);
      throw error;
    }
  },

  calculateDistance: async (
    origenLat: number,
    origenLng: number,
    destinoLat: number,
    destinoLng: number
  ): Promise<{ distanciaKm: number; duracionMin?: number }> => {
    try {
      const response = await apiClient.get<ApiResponse<{ distanciaKm: number; duracionMin?: number }>>('/geolocalizacion/distancia', {
        params: { origenLat, origenLng, destinoLat, destinoLng },
      });
      return response.data.data;
    } catch (error) {
      console.error('Error al calcular distancia:', error);
      throw error;
    }
  },

  getNearbyStores: async (lat: number, lng: number, radio: number): Promise<NearbyStore[]> => {
    try {
      const response = await apiClient.get<ApiResponse<NearbyStore[]>>('/geolocalizacion/tiendas-cercanas', {
        params: { lat, lng, radio },
      });
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener tiendas cercanas:', error);
      throw error;
    }
  },

  updateStoreCoordinates: async (payload: { id?: string; lat: number; lng: number; direccion?: string }): Promise<any> => {
    try {
      const response = await apiClient.post<ApiResponse<any>>('/geolocalizacion/actualizar-coordenadas-tienda', payload);
      return response.data.data;
    } catch (error) {
      console.error('Error al actualizar coordenadas de tienda:', error);
      throw error;
    }
  },
};

export default apiClient;