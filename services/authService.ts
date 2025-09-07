import axios, { AxiosInstance } from 'axios';
import { safeAsyncStorage } from './storageUtils';

// Configuración base de la API
const API_BASE_URL = 'https://mi-tienda-backend-o9i7.onrender.com';

// Crear instancia de axios para autenticación
const authClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Interceptor para manejar respuestas y errores de autenticación
authClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await safeAsyncStorage.removeItem('authToken');
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

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Helper para extraer datos independientemente del formato
function extractData<T>(response: any): T {
  const body = response.data;
  // Si la respuesta tiene estructura {data: ...}, extraer data
  if (body && typeof body === 'object' && 'data' in body && !Array.isArray(body)) {
    return body.data as T;
  }
  // Si es un array o un objeto directo, devolverlo tal como está
  return body as T;
}

// Servicios de autenticación
export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await authClient.post<ApiResponse<LoginResponse>>('/auth/login', credentials, {
        headers: { 'Content-Type': 'application/json' },
      });
      const data = extractData<LoginResponse>(response);
      const { token } = data;
      await safeAsyncStorage.setItem('authToken', token);
      return data;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    try {
      await safeAsyncStorage.removeItem('authToken');
    } catch (error) {
      console.error('Error en logout:', error);
      throw error;
    }
  },

  getToken: async (): Promise<string | null> => {
    try {
      return await safeAsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error al obtener token:', error);
      return null;
    }
  },

  isAuthenticated: async (): Promise<boolean> => {
    try {
      const token = await safeAsyncStorage.getItem('authToken');
      return !!token;
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
      return false;
    }
  }
};

export default authClient;