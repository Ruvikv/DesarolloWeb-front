import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { safeAsyncStorage } from './storageUtils';

// Configuración base de la API
const API_BASE_URL = 'https://mi-tienda-backend-o9i7.onrender.com';

// Crear instancia de axios para catálogo
const catalogoClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Interceptor para agregar token a las peticiones (omitir si x-skip-auth)
catalogoClient.interceptors.request.use(
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
catalogoClient.interceptors.response.use(
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

// Normaliza URLs de imágenes (corrige duplicados en la ruta)
function normalizeImageUrl(url: string): string {
  if (!url) return url;
  let fixed = url.trim();
  // Elimina duplicaciones del segmento 'product-images'
  while (fixed.includes('product-images/product-images/')) {
    fixed = fixed.replace('product-images/product-images/', 'product-images/');
  }
  return fixed;
}

// Interfaces para productos
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
}

// Interfaz para la respuesta del backend
interface BackendProduct {
  id: string;
  nombre: string;
  descripcion: string;
  precio_final: number;
  imagen_principal?: string;
  imagen?: string;
  categoria: string;
  stock: number;
}

// Helper para mapear productos del backend al frontend
function mapBackendProduct(backendProduct: BackendProduct): Product {
  const rawImage = backendProduct.imagen_principal || backendProduct.imagen || '';
  return {
    id: backendProduct.id,
    name: backendProduct.nombre,
    description: backendProduct.descripcion,
    price: backendProduct.precio_final,
    image: normalizeImageUrl(rawImage),
    category: backendProduct.categoria,
    stock: backendProduct.stock
  };
}



// Servicios de productos
export const productService = {
  getPublicProducts: async (): Promise<Product[]> => {
    try {
      const response = await catalogoClient.get('/catalogo/publico', {
        // Evitar headers personalizados; usar bandera local para el interceptor
        ...( { skipAuth: true } as any ),
        withCredentials: false,
      });
      const backendProducts = extractData<BackendProduct[]>(response);
      return backendProducts.map(mapBackendProduct);
    } catch (error) {
      console.error('Error al obtener productos públicos:', error);
      throw error;
    }
  },

  getProductById: async (id: string): Promise<Product> => {
    try {
      const response = await catalogoClient.get(`/catalogo/producto/${id}`, {
        ...( { skipAuth: true } as any ),
        withCredentials: false,
      });
      const backendProduct = extractData<BackendProduct>(response);
      return mapBackendProduct(backendProduct);
    } catch (error) {
      console.error('Error al obtener producto:', error);
      throw error;
    }
  },

  getVisualCatalog: async (): Promise<Product[]> => {
    try {
      const response = await catalogoClient.get('/catalogo/visual', {
        ...( { skipAuth: true } as any ),
        // Usar configuración específica para evitar problemas CORS
        withCredentials: false,
      });
      const backendProducts = extractData<BackendProduct[]>(response);
      return backendProducts.map(mapBackendProduct);
    } catch (error) {
      console.error('Error al obtener catálogo visual:', error);
      throw error;
    }
  },

  getFeaturedProducts: async (): Promise<Product[]> => {
    try {
      const response = await catalogoClient.get('/catalogo/destacados', {
        ...( { skipAuth: true } as any ),
        withCredentials: false,
      });
      const backendProducts = extractData<BackendProduct[]>(response);
      return backendProducts.map(mapBackendProduct);
    } catch (error) {
      console.error('Error al obtener productos destacados:', error);
      throw error;
    }
  },

  searchProducts: async (query: string): Promise<Product[]> => {
    try {
      const response = await catalogoClient.get(`/catalogo/buscar?q=${encodeURIComponent(query)}`, {
        ...( { skipAuth: true } as any ),
        withCredentials: false,
      });
      const backendProducts = extractData<BackendProduct[]>(response);
      return backendProducts.map(mapBackendProduct);
    } catch (error) {
      console.error('Error al buscar productos:', error);
      throw error;
    }
  }
};

export default catalogoClient;