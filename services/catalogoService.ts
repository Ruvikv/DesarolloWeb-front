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
  price?: number;
  image: string;
  category: string;
  stock: number;
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
  const rawImage = backendProduct.imagen_principal || backendProduct.imagen || '';
  return {
    id: backendProduct.id,
    name: backendProduct.nombre,
    description: backendProduct.descripcion,
    price: backendProduct.precio_final ?? backendProduct.precios_productos?.[0]?.precio_final,
    image: normalizeImageUrl(rawImage),
    category: backendProduct.categoria,
    stock: backendProduct.stock
  };
}



// Servicios de productos
export const productService = {
  getPublicProducts: async (): Promise<Product[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/catalogo/publico`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const backendProducts: BackendProduct[] = await response.json();
      console.log('🔍 Productos destacados del backend:', backendProducts);
      console.log('🔍 Primer producto destacado:', backendProducts[0]);
      if (backendProducts[0]) {
        console.log('🔍 Precio del primer producto:', backendProducts[0].precio_final);
      }
      return backendProducts.map(mapBackendProduct);
    } catch (error) {
      console.error('Error al obtener productos públicos:', error);
      throw error;
    }
  },

  getVisualCatalog: async (): Promise<Product[]> => {
    try {
      // Usar fetch con mode: 'cors' y headers apropiados para evitar problemas CORS
      const response = await fetch(`${API_BASE_URL}/catalogo/visual`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const backendProducts: BackendProduct[] = await response.json();
      return backendProducts.map(mapBackendProduct);
    } catch (error) {
      console.error('Error al obtener catálogo visual:', error);
      throw error;
    }
  },

  getFeaturedProducts: async (): Promise<Product[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/catalogo/destacados`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const backendProducts: BackendProduct[] = await response.json();
      return backendProducts.map(mapBackendProduct);
    } catch (error) {
      console.error('Error al obtener productos destacados:', error);
      throw error;
    }
  },

  searchProducts: async (query: string): Promise<Product[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/catalogo/buscar?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const backendProducts: BackendProduct[] = await response.json();
      return backendProducts.map(mapBackendProduct);
    } catch (error) {
      console.error('Error al buscar productos:', error);
      throw error;
    }
  },

  getProductById: async (id: string): Promise<Product> => {
    try {
      const response = await fetch(`${API_BASE_URL}/catalogo/producto/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const backendProduct: BackendProduct = await response.json();
      return mapBackendProduct(backendProduct);
    } catch (error) {
      console.error('Error al obtener producto por ID:', error);
      throw error;
    }
  }
};

export default {
  getPublicProducts: productService.getPublicProducts,
  getProductById: async (id: string): Promise<Product> => {
    try {
      const response = await fetch(`${API_BASE_URL}/catalogo/producto/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const backendProduct: BackendProduct = await response.json();
      return mapBackendProduct(backendProduct);
    } catch (error) {
      console.error('Error al obtener producto por ID:', error);
      throw error;
    }
  },
  getVisualCatalog: async (): Promise<Product[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/catalogo/visual`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const backendProducts: BackendProduct[] = await response.json();
      return backendProducts.map(mapBackendProduct);
    } catch (error) {
      console.error('Error al obtener catálogo visual:', error);
      throw error;
    }
  },
  getFeaturedProducts: async (): Promise<Product[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/catalogo/destacados`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const backendProducts: BackendProduct[] = await response.json();
      return backendProducts.map(mapBackendProduct);
    } catch (error) {
      console.error('Error al obtener productos destacados:', error);
      throw error;
    }
  },
  searchProducts: async (query: string): Promise<Product[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/catalogo/buscar?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const backendProducts: BackendProduct[] = await response.json();
      return backendProducts.map(mapBackendProduct);
    } catch (error) {
      console.error('Error al buscar productos:', error);
      throw error;
    }
  }
};