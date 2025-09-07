import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { safeAsyncStorage } from './storageUtils';

// Configuración base de la API
const API_BASE_URL = 'https://mi-tienda-backend-o9i7.onrender.com';

// Crear instancia de axios para categorías
const categoriasClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
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

// Reintentos para GET con backoff exponencial
function shouldRetry(error: any): boolean {
  const status = error?.response?.status;
  return (
    error?.code === 'ECONNABORTED' ||
    !error?.response ||
    status === 502 || status === 503 || status === 504
  );
}

function delay(ms: number) { return new Promise(res => setTimeout(res, ms)); }

async function getWithRetry<T>(url: string, config: any = {}, tries = 3, baseDelay = 1000): Promise<AxiosResponse<T>> {
  let lastError: any;
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      const resp = await categoriasClient.get<T>(url, config);
      return resp;
    } catch (error: any) {
      lastError = error;
      if (attempt < tries - 1 && shouldRetry(error)) {
        const wait = baseDelay * Math.pow(2, attempt);
        // eslint-disable-next-line no-console
        console.warn(`GET ${url} falló (intento ${attempt + 1}/${tries}). Reintentando en ${wait}ms...`);
        await delay(wait);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
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
      const response = await getWithRetry<Categoria[]>('/categorias', {
        // Usar bandera local para el interceptor (endpoint público)
        ...( { skipAuth: true } as any ),
        withCredentials: false,
      });
      const categorias = extractData<Categoria[]>(response);
      return categorias.filter(cat => cat.activo); // Solo categorías activas
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      throw error;
    }
  },

  obtenerPorId: async (id: string): Promise<Categoria> => {
    try {
      const response = await getWithRetry<Categoria>(`/categorias/${id}`, {
        ...( { skipAuth: true } as any ),
        withCredentials: false,
      });
      const categoria = extractData<Categoria>(response);
      return categoria;
    } catch (error) {
      console.error('Error al obtener categoría:', error);
      throw error;
    }
  }
};

export default categoriasClient;