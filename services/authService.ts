import axios from 'axios';
import { API_CONFIG } from '../config/api';

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Importante para las cookies HTTP-only
});

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