import axios from 'axios';
 import { API_CONFIG } from '../config/api.js';
 
 const apiClient = axios.create({
   baseURL: API_CONFIG.BASE_URL,
   timeout: 30000,
   // Remover headers que causan preflight CORS
   // withCredentials: true,
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

export interface RegisterRequest {
  firstName: string;
  activationCode: string;
  lastName: string;
  email: string;
  phone: number;
  password: string;
  direccion: string;
}

// Servicios de autenticación
export const authService = {

  async login(email: string, password: string) {
    try {
      const response = await apiClient.post('/auth/login', {
        email: email.trim(),
        password: password
      });
      // Normalizar la respuesta del backend: convertir access_token -> token
      const raw = response.data || {};
      const token = raw.access_token || raw.token || raw.jwt || raw.accessToken || '';
      const userRaw = raw.user || {};
      const user = userRaw
        ? {
            id: String(userRaw.id ?? userRaw._id ?? ''),
            email: userRaw.email ?? '',
            name:
              (userRaw.name ?? [userRaw.nombre, userRaw.apellido].filter(Boolean).join(' ')).trim() ||
              (userRaw.nombre ?? '')
          }
        : undefined;

      return {
        success: !!token, // Considerar éxito solo si hay token
        data: { token, user },
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
  },


  async createProfileAdmin(nombre: string,codigo:string, apellido: string, email: string, telefono: number, password: string,direccion: string){
    try{
      const response = await apiClient.post('/auth/register/admin-con-codigo', {
        codigo: codigo,
        email: email,
        password: password,
        nombre: nombre,
        apellido: apellido,
        telefono: telefono,
        direccion: direccion
      });
      // console.log("response",response)
      return response.data
    } catch (error: any) {
      // console.log("error", error)
      throw new Error(error.response?.data?.message)
    }
  },

  async createProfileRevendedor(nombreNegocio: string,nombre:string, apellido: string, condicionFiscal: string, email: string, telefono: number,password: string){
    try{
      const response = await apiClient.post('/auth/register/revendedor', {
        nombreNegocio: nombreNegocio,
        nombre: nombre,
        apellido: apellido,
        condicionFiscal: condicionFiscal,
        email: email,
        telefono: telefono,
        password: password,
      });
      console.log("response",response)
      return response.data
    } catch (error: any) {
      console.log("error", error)
      throw new Error(error.response?.data?.message)
    }
  }
};