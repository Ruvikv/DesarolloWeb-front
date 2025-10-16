import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { safeAsyncStorage } from './storageUtils';
import { API_CONFIG } from '../config/api.js';

// Configuración base de la API
const API_BASE_URL = API_CONFIG.BASE_URL;

// Cliente axios para productos (admin)
const productosClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  // Alinear con config global (30s) para evitar timeouts por cold start
  timeout: 30000,
});

// Inyecta token y evita preflight en GET
productosClient.interceptors.request.use(
  async (config) => {
    try {
      const headers = (config.headers = config.headers || {});
      const token = await safeAsyncStorage.getItem('authToken');
      if (token) headers.Authorization = `Bearer ${token}`;
      console.log(`[productosClient] Request method=${config.method} url=${config.url} hasAuth=${!!token}`);
      if ((config.method || 'get').toLowerCase() === 'get') {
        const { ['Content-Type']: _omit, ['content-type']: _omit2, ...rest } = headers as any;
        config.headers = rest;
      }
    } catch (e) {
      console.warn('productosClient request interceptor error', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

productosClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;
    console.warn(`[productosClient] Response error status=${status} data=${typeof data === 'string' ? data : JSON.stringify(data)}`);
    if (error.response?.status === 401) {
      await safeAsyncStorage.removeItem('authToken');
    }
    return Promise.reject(error);
  }
);

// Tipos
export interface ProductoAdmin {
  id: string;
  nombre: string;
  descripcion?: string;
  sku?: string;
  categoria_id?: string;
  categoria_nombre?: string;
  stock?: number;
  activo?: boolean;
  precio_costo?: number;
  precio_costo_ajustado?: number | null;
  porcentaje_aplicado?: number | null; // backend aplica default 45 cuando es null
}

export interface Categoria { id: string; nombre: string; activo: boolean }

// Utilidades
const STOCK_CRITICO = 5;

function precioBase(producto: ProductoAdmin): number {
  const base = producto.precio_costo_ajustado ?? producto.precio_costo ?? 0;
  return Number(base) || 0;
}

export function calcularPrecioFinal(producto: ProductoAdmin, porcentaje?: number): number {
  const p = porcentaje ?? (producto.porcentaje_aplicado ?? 45);
  const base = precioBase(producto);
  return Number((base * (1 + (Number(p) || 0) / 100)).toFixed(2));
}

export function calcularPrecioTemporal(producto: ProductoAdmin, porcentajeTemporal?: number): number {
  const pct = porcentajeTemporal ?? producto.porcentaje_aplicado ?? 45;
  const base = precioBase(producto);
  return Number((base * (1 + (Number(pct) || 0) / 100)).toFixed(2));
}

// Normaliza distintas formas de payload del backend a un array
function normalizeArrayPayload<T>(payload: any): T[] {
  try {
    if (Array.isArray(payload)) return payload as T[];
    if (Array.isArray(payload?.data)) return payload.data as T[];
    if (Array.isArray(payload?.items)) return payload.items as T[];
    if (Array.isArray(payload?.productos)) return payload.productos as T[];
    return [] as T[];
  } catch {
    return [] as T[];
  }
}

// Servicios
export const productosService = {
  listarActivos: async (): Promise<ProductoAdmin[]> => {
    try {
      // Preferir listado admin con cálculo de ganancia
      const { data } = await productosClient.get<ProductoAdmin[]>('/productos', {
        params: { conGanancia: 'true' },
      });
      return normalizeArrayPayload<ProductoAdmin>(data);
    } catch (err) {
      // Fallback a listado público si el admin falla (p.ej., 401/404)
      try {
        const { data } = await productosClient.get<ProductoAdmin[]>('/productos/publico');
        return normalizeArrayPayload<ProductoAdmin>(data);
      } catch (err2) {
        throw err2;
      }
    }
  },

  listarInactivos: async (): Promise<ProductoAdmin[]> => {
    const { data } = await productosClient.get<ProductoAdmin[]>('/productos/inactivos');
    return normalizeArrayPayload<ProductoAdmin>(data);
  },

  actualizarProductoCatalogo: async (
    id: string,
    payload: {
      nombre?: string;
      descripcion?: string;
      precio_costo?: number;
      categoria?: string;
      stock?: number;
      sku?: string;
      unidad_id?: number | null;
      activo?: boolean;
    }
  ): Promise<any> => {
    const form = new FormData();
    if (payload.nombre !== undefined) form.append('nombre', String(payload.nombre));
    if (payload.descripcion !== undefined) form.append('descripcion', String(payload.descripcion));
    if (payload.precio_costo !== undefined) form.append('precio_costo', String(payload.precio_costo));
    if (payload.categoria !== undefined) form.append('categoria', String(payload.categoria));
    if (payload.stock !== undefined) form.append('stock', String(payload.stock));
    if (payload.sku !== undefined) form.append('sku', String(payload.sku));
    if (payload.unidad_id !== undefined && payload.unidad_id !== null) form.append('unidad_id', String(payload.unidad_id));
    if (payload.activo !== undefined) form.append('activo', String(payload.activo));

    try {
      console.log('[productosService] PUT multipart /productos/' + id, { payload });
      // No fijar Content-Type: axios lo establece automáticamente con boundary
      // Aumentar timeout para PUT (Render puede despertar lento)
      const { data } = await productosClient.put(`/productos/${id}`, form, { timeout: 60000 });
      console.log('[productosService] PUT multipart OK', { data });
      return data;
    } catch (err) {
      const status = (err as any)?.response?.status;
      const errorData = (err as any)?.response?.data;
      console.warn(`[productosService] PUT multipart falló, intentando JSON status=${status} data=${typeof errorData === 'string' ? errorData : JSON.stringify(errorData)}`);
      // Fallback: intentar enviar como JSON si multipart falla
      const { data: jsonData } = await productosClient.put(`/productos/${id}`, payload, {
        timeout: 60000,
        headers: { 'Content-Type': 'application/json' },
      });
      console.log('[productosService] PUT JSON OK', { data: jsonData });
      return jsonData;
    }
  },

  actualizarPorcentaje: async (id: string, porcentaje: number): Promise<any> => {
    const { data } = await productosClient.patch(`/productos/${id}/porcentaje-ganancia`, { porcentaje });
    return data;
  },

  generarPreciosConsumidorFinal: async (): Promise<{ ok: boolean }> => {
    const { data } = await productosClient.post('/precios/generar-consumidor-final', {});
    return data;
  },
};

export { STOCK_CRITICO };