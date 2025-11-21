import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { safeAsyncStorage } from './storageUtils';
import { fetchWithTimeout } from './httpUtils';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { API_CONFIG } from '../config/api.js';
import { prewarmService } from './prewarmService';

// Configuración base de la API: usar misma BASE_URL para web y nativo (se define vía EXPO_PUBLIC_API_URL o fallback)
const API_BASE_URL = API_CONFIG.BASE_URL;

// Crear instancia de axios para catálogo
const catalogoClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_CONFIG.TIMEOUT || 30000, // Usar timeout de config (30s) para cold starts de Render
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

// Asegura que la URL de imagen sea válida para React Native (evita números u objetos)
function sanitizeImageUrl(input: any): string {
  try {
    if (typeof input !== 'string') return '';
    let fixed = normalizeImageUrl(input);
    if (!fixed) return '';
    // Solo permitir http(s). Si el backend devuelve otra cosa (ej: id numérico), evitar crasheo
    if (!/^https?:\/\//i.test(fixed)) return '';
    return fixed;
  } catch {
    return '';
  }
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
  const rawImage: any = backendProduct.imagen_principal || backendProduct.imagen || '';
  return {
    id: backendProduct.id,
    name: backendProduct.nombre,
    description: backendProduct.descripcion,
    price: backendProduct.precio_final ?? backendProduct.precios_productos?.[0]?.precio_final,
    image: sanitizeImageUrl(rawImage),
    category: backendProduct.categoria,
    stock: backendProduct.stock
  };
}



// Servicios de productos
export const productService = {
  getPublicProducts: async (): Promise<Product[]> => {
    try {
      let response = await fetchWithTimeout(`${API_BASE_URL}/catalogo/publico`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
                  },
        mode: 'cors',
        timeoutMs: 30000,
      });
      
      if (!response.ok) {
        // Si el backend respondió con 5xx, intentar pre-calentar y reintentar una vez
        if (response.status >= 500) {
          console.warn(`Servidor respondió ${response.status} en /catalogo/publico, intentando reintento tras warmup...`);
          // await prewarmService.warmupBackend();
          const response2 = await fetchWithTimeout(`${API_BASE_URL}/catalogo/publico`, {
            method: 'GET',
            headers: {
              Accept: 'application/json',
            },
            mode: 'cors',
            timeoutMs: 45000,
          });
          if (!response2.ok) throw new Error(`HTTP error! status: ${response2.status}`);
          const backendProducts2: BackendProduct[] = await response2.json();
          return backendProducts2.map(mapBackendProduct);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const backendProducts: BackendProduct[] = await response.json();
      // console.log('🔍 Productos destacados del backend:', backendProducts);
      // console.log('🔍 Primer producto destacado:', backendProducts[0]);
      if (backendProducts[0]) {
        // console.log('🔍 Precio del primer producto:', backendProducts[0].precio_final);
      }
      return backendProducts.map(mapBackendProduct);
    } catch (error) {
      const isAbort = error instanceof Error && /Abort/i.test(error.name + ' ' + error.message);
      if (isAbort) {
        try {
          // await prewarmService.warmupBackend();
          const response2 = await fetchWithTimeout(`${API_BASE_URL}/catalogo/publico`, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            mode: 'cors',
            timeoutMs: 45000,
          });
          if (!response2.ok) throw new Error(`HTTP error! status: ${response2.status}`);
          const backendProducts2: BackendProduct[] = await response2.json();
          return backendProducts2.map(mapBackendProduct);
      } catch (e2) {
        console.error('Reintento fallido al obtener productos públicos:', e2);
      }
      }
      console.error('Error al obtener productos públicos:', error);
      throw error;
    }
  },

  getVisualCatalog: async (): Promise<Product[]> => {
    try {
      // Usar fetch con mode: 'cors' y headers apropiados para evitar problemas CORS
      let response = await fetchWithTimeout(`${API_BASE_URL}/catalogo/visual`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        mode: 'cors',
        timeoutMs: 30000,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const backendProducts: BackendProduct[] = await response.json();
      return backendProducts.map(mapBackendProduct);
    } catch (error) {
      const isAbort = error instanceof Error && /Abort/i.test(error.name + ' ' + error.message);
      if (isAbort) {
        try {
          // await prewarmService.warmupBackend();
          const response2 = await fetchWithTimeout(`${API_BASE_URL}/catalogo/visual`, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            mode: 'cors',
            timeoutMs: 45000,
          });
          if (!response2.ok) throw new Error(`HTTP error! status: ${response2.status}`);
          const backendProducts2: BackendProduct[] = await response2.json();
          return backendProducts2.map(mapBackendProduct);
        } catch (e2) {
          console.error('Reintento fallido al obtener catálogo visual:', e2);
        }
      }
      console.error('Error al obtener catálogo visual:', error);
      throw error;
    }
  },

  getFeaturedProducts: async (): Promise<Product[]> => {
    try {
      let response = await fetchWithTimeout(`${API_BASE_URL}/catalogo/destacados`, {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        },
        mode: 'cors',
        timeoutMs: 30000,
      });

      if (!response.ok) {
        if (response.status >= 500) {
          console.warn(`Servidor respondió ${response.status} en /catalogo/destacados, intentando reintento tras warmup...`);
          // await prewarmService.warmupBackend();
          const response2 = await fetchWithTimeout(`${API_BASE_URL}/catalogo/destacados`, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            mode: 'cors',
            timeoutMs: 45000,
          });
          if (!response2.ok) throw new Error(`HTTP error! status: ${response2.status}`);
          const backendProducts2: BackendProduct[] = await response2.json();
          return backendProducts2.map(mapBackendProduct);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const backendProducts: BackendProduct[] = await response.json();
      return backendProducts.map(mapBackendProduct);
    } catch (error) {
      const isAbort = error instanceof Error && /Abort/i.test(error.name + ' ' + error.message);
      if (isAbort) {
        try {
          // await prewarmService.warmupBackend();
          const response2 = await fetchWithTimeout(`${API_BASE_URL}/catalogo/destacados`, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            mode: 'cors',
            timeoutMs: 45000,
          });
          if (!response2.ok) throw new Error(`HTTP error! status: ${response2.status}`);
          const backendProducts2: BackendProduct[] = await response2.json();
          return backendProducts2.map(mapBackendProduct);
        } catch (e2) {
          console.error('Reintento fallido al obtener productos destacados:', e2);
        }
      }
      console.error('Error al obtener productos destacados:', error);
      throw error;
    }
  },

  searchProducts: async (query: string): Promise<Product[]> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/catalogo/buscar?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        mode: 'cors',
        timeoutMs: 30000,
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
      const response = await fetchWithTimeout(`${API_BASE_URL}/catalogo/producto/${id}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        mode: 'cors',
        timeoutMs: 30000,
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
  
  downloadCatalogExcel: async (): Promise<void> => {
    try {
      const token = await safeAsyncStorage.getItem('authToken');
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const endpoint = `${API_BASE_URL}/catalogo/descargar/excel`;
      if (Platform.OS === 'web') {
        const res = await fetchWithTimeout(endpoint, {
          method: 'GET',
          headers,
          mode: 'cors',
          timeoutMs: 30000,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'catalogo.xlsx';
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        await WebBrowser.openBrowserAsync(endpoint, { enableDefaultShareMenuItem: true });
      }
    } catch (error) {
      console.error('Error al descargar Excel:', error);
      throw error;
    }
  },

  downloadCatalogPDF: async (): Promise<void> => {
    try {
      const token = await safeAsyncStorage.getItem('authToken');
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      headers['Accept'] = 'application/pdf';

      const endpoint = `${API_BASE_URL}/productos/exportar/pdf`;
      if (Platform.OS === 'web') {
        const res = await fetchWithTimeout(endpoint, {
          method: 'GET',
          headers,
          mode: 'cors',
          timeoutMs: 30000,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'catalogo.pdf';
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        await WebBrowser.openBrowserAsync(endpoint, { enableDefaultShareMenuItem: true });
      }
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      throw error;
    }
  }
};

export default {
  getPublicProducts: productService.getPublicProducts,
  getProductById: productService.getProductById,
  getVisualCatalog: productService.getVisualCatalog,
  getFeaturedProducts: productService.getFeaturedProducts,
  searchProducts: productService.searchProducts,
  downloadCatalogExcel: productService.downloadCatalogExcel,
  downloadCatalogPDF: productService.downloadCatalogPDF
};

// Actualización de nombre/descripcion vía catálogo (PATCH JSON)
export async function actualizarDescripcionCatalogo(
  id: string,
  payload: { nombre?: string; descripcion?: string },
  opts?: { token?: string }
): Promise<any> {
  const tok = opts?.token ?? (await safeAsyncStorage.getItem('authToken')) ?? '';
  
  try {
    const headers: Record<string, string> = {};
    const hasAuth = !!tok;
    if (hasAuth) headers.Authorization = `Bearer ${tok}`;
    
    // Log detallado del token para diagnóstico
    console.log(`[catalogoService] PATCH /catalogo/producto/${id} hasAuth=${hasAuth}`);
    console.log(`[catalogoService] Token length: ${tok.length}, starts with: ${tok.substring(0, 20)}...`);
    console.log(`[catalogoService] Headers:`, headers);
    
    const res = await catalogoClient.patch(`/catalogo/producto/${id}`, payload, { headers });
    return res.data;
  } catch (error: any) {
    const status = error?.response?.status;
    const data = error?.response?.data;
    console.error(`[catalogoService] PATCH /catalogo/producto/${id} fallo status=${status}`, data);
    console.error(`[catalogoService] Token usado:`, tok.substring(0, 50) + '...');
    throw error;
  }
}

// =====================
// Funciones ADMIN CATÁLOGO
// =====================

// Tipo para productos del panel admin de catálogo
export interface ProductoCatalogoAdmin {
  id: string;
  nombre: string;
  descripcion?: string;
  precio_final?: number;
  categoria?: string;
  stock?: number;
  imagen_principal?: string | null;
  imagenes?: string[];
  destacado?: boolean;
}

// Obtiene productos para administración del catálogo
export async function getCatalogProductsAdmin(): Promise<ProductoCatalogoAdmin[]> {
  try {
    const token = await safeAsyncStorage.getItem('authToken');
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await catalogoClient.get('/catalogo/productos', { headers });
    const raw = extractData<any[]>(res) || [];
    return raw.map((p) => ({
      id: String(p.id),
      nombre: p.nombre,
      descripcion: p.descripcion,
      precio_final: p.precio_final ?? p?.precios_productos?.[0]?.precio_final,
      categoria: p.categoria,
      stock: p.stock,
      imagen_principal: sanitizeImageUrl(p.imagen_principal || p.imagen || ''),
      imagenes: Array.isArray(p.imagenes)
        ? p.imagenes.map((u: any) => sanitizeImageUrl(typeof u === 'string' ? u : String(u || ''))).filter(Boolean)
        : [],
      destacado: Boolean(p.destacado),
    }));
  } catch (error) {
    console.error('Error al obtener productos admin catálogo:', error);
    throw error;
  }
}

// Actualiza/sube imagen principal de un producto
export async function actualizarImagenPrincipalAdmin(id: string, file: File | Blob): Promise<any> {
  try {
    const token = await safeAsyncStorage.getItem('authToken');
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const form = new FormData();
    // Nombre del campo asumido como 'imagen'; ajustar si backend usa otro nombre
    form.append('imagen', file as any);

    const res = await catalogoClient.put(`/catalogo/producto/${id}/imagen-principal`, form, {
      headers: { ...headers, 'Content-Type': 'multipart/form-data' },
    });
    const data = res.data;
    if (data?.imagen_principal) {
      data.imagen_principal = sanitizeImageUrl(data.imagen_principal);
    }
    return data;
  } catch (error) {
    console.error(`Error al actualizar imagen principal del producto ${id}:`, error);
    throw error;
  }
}

// Agrega imágenes a la galería del producto
export async function agregarImagenesGaleriaAdmin(id: string, files: (File | Blob)[]): Promise<any> {
  try {
    const token = await safeAsyncStorage.getItem('authToken');
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const form = new FormData();
    files.forEach((f) => form.append('imagenes', f as any));

    const res = await catalogoClient.post(`/catalogo/producto/${id}/imagenes`, form, {
      headers: { ...headers, 'Content-Type': 'multipart/form-data' },
    });
    const data = res.data;
    if (Array.isArray(data?.imagenes)) {
      data.imagenes = data.imagenes.map((u: any) => sanitizeImageUrl(typeof u === 'string' ? u : String(u || ''))).filter(Boolean);
    }
    return data;
  } catch (error) {
    console.error(`Error al agregar imágenes a la galería del producto ${id}:`, error);
    throw error;
  }
}

// Elimina la imagen principal del producto
export async function eliminarImagenPrincipalAdmin(id: string): Promise<any> {
  try {
    const token = await safeAsyncStorage.getItem('authToken');
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await catalogoClient.delete(`/catalogo/producto/${id}/imagen-principal`, { headers });
    return res.data;
  } catch (error) {
    console.error(`Error al eliminar imagen principal del producto ${id}:`, error);
    throw error;
  }
}

// Elimina una imagen específica de la galería
export async function eliminarImagenGaleriaAdmin(id: string, url: string): Promise<any> {
  try {
    const token = await safeAsyncStorage.getItem('authToken');
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    // Algunos backends aceptan cuerpo JSON en DELETE; si no, considerar usar query param
    const res = await catalogoClient.delete(`/catalogo/producto/${id}/imagen`, {
      headers,
      data: { url },
    } as any);
    const data = res.data;
    if (Array.isArray(data?.imagenes)) {
      data.imagenes = data.imagenes.map((u: any) => sanitizeImageUrl(typeof u === 'string' ? u : String(u || ''))).filter(Boolean);
    }
    return data;
  } catch (error) {
    console.error(`Error al eliminar imagen de la galería del producto ${id}:`, error);
    throw error;
  }
}

// Alterna el estado de destacado del producto
export async function toggleDestacadoAdmin(id: string, val: boolean): Promise<any> {
  try {
    const token = await safeAsyncStorage.getItem('authToken');
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await catalogoClient.patch(`/catalogo/producto/${id}/destacado`, { destacado: val }, { headers });
    return res.data;
  } catch (error) {
    console.error(`Error al alternar destacado del producto ${id}:`, error);
    throw error;
  }
}