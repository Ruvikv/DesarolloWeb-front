import axios from 'axios';
import { API_CONFIG } from '../config/api';

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  // Remover headers que causan preflight CORS
  // withCredentials: true, // Comentado para evitar CORS
});

// Interceptor para manejar headers sin causar preflight
apiClient.interceptors.request.use(
  (config) => {
    // Solo agregar Accept header para evitar preflight
    config.headers = config.headers || {};
    config.headers['Accept'] = 'application/json';
    
    // Para POST, agregar Content-Type solo si es necesario
    if (config.method === 'post' && config.data) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

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

// Servicios de autenticación
export const authService = {
  async login(email: string, password: string) {
    try {
      const response = await apiClient.post('/auth/login', {
        email: email.trim(),
        password: password
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Error de login:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error de conexión'
      };
    }
  },

  async getProfile() {
    try {
      const response = await apiClient.get('/auth/profile');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener perfil');
    }
  }
};