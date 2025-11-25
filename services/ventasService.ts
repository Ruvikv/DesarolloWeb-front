import axios, { AxiosInstance } from 'axios';
import { API_CONFIG } from '../config/api.js';
import { safeAsyncStorage } from './storageUtils';

const API_BASE_URL = API_CONFIG.BASE_URL;

// Cliente axios para ventas
export const ventasClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// ============================================
// INTERCEPTORS
// ============================================

ventasClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await safeAsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Remover Content-Type para requests GET
      if (config.method?.toLowerCase() === 'get') {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
      }
    } catch (e) {
      console.warn('[ventasClient] Error en interceptor de request:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

ventasClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || '';

    console.error(`[ventasClient] Error ${status} en ${url}:`, error?.response?.data);

    // Logout automático en 401
    if (status === 401) {
      await safeAsyncStorage.removeItem('authToken');
    }

    return Promise.reject(error);
  }
);

// ============================================
// UTILIDADES
// ============================================

function normalizeArrayPayload<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function getErrorMessage(error: any): string {
  const errorData = error?.response?.data;

  if (typeof errorData === 'string') return errorData;
  if (Array.isArray(errorData?.message)) return errorData.message.join('; ');
  if (errorData?.message) return errorData.message;

  return `Error ${error?.response?.status || ''} en la solicitud`;
}

// ============================================
// INTERFACES
// ============================================

export interface VentaMinoristaItem {
  producto_id: string;
  cantidad: number;
  precio_venta: number;
  nombre_comprador: string;
  metodo_pago?: string;
  notas?: string;
  factura?: boolean;
}

export interface VentaManualItem {
  producto_id?: string;
  cantidad: number;
  precio_venta?: number;
  precio_costo_personalizado?: number;
  precio_unitario?: number;
}

export interface CreateVentaManual {
  total?: number;
  nombre_comprador?: string;
  metodo_pago?: string;
  notas?: string;
  factura?: boolean;
  items: VentaManualItem[];
}

export interface RegistrarVentaProducto {
  id: string;
  cantidad: number;
}

export interface RegistrarVentaPayload {
  productos: RegistrarVentaProducto[];
  metodo_pago?: string;
  nombre_comprador?: string;
  cliente?: string;
  notas?: string;
}

export interface VentaMinorista {
  id: string;
  producto_id: string;
  cantidad: number;
  precio_venta: number;
  nombre_comprador: string;
  metodo_pago?: string;
  notas?: string;
  factura?: boolean;
  fecha?: string;
}

// ============================================
// SERVICIO
// ============================================

export const ventasService = {
  /**
   * Listar todas las ventas minoristas
   */
  listarMinoristas: async (): Promise<VentaMinorista[]> => {
    const { data } = await ventasClient.get('/ventas/minoristas');
    return normalizeArrayPayload<VentaMinorista>(data);
  },

  /**
   * Registrar una venta minorista (un solo producto)
   */
  registrarMinorista: async (payload: VentaMinoristaItem): Promise<any> => {
    // Validación básica
    if (!payload.producto_id?.trim()) {
      throw new Error('producto_id es requerido');
    }
    if (!payload.cantidad || payload.cantidad <= 0) {
      throw new Error('cantidad debe ser mayor a 0');
    }
    if (!payload.precio_venta || payload.precio_venta <= 0) {
      throw new Error('precio_venta debe ser mayor a 0');
    }
    if (!payload.nombre_comprador?.trim()) {
      throw new Error('nombre_comprador es requerido');
    }

    const body = {
      producto_id: payload.producto_id.trim(),
      cantidad: payload.cantidad,
      precio_venta: payload.precio_venta,
      nombre_comprador: payload.nombre_comprador.trim(),
      metodo_pago: payload.metodo_pago || 'Efectivo',
      notas: payload.notas || null,
      factura: payload.factura || false,
    };

    try {
      const { data } = await ventasClient.post('/ventas/minoristas', body);
      return data;
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Registrar venta manual con múltiples ítems
   */
  registrarVentaManual: async (payload: CreateVentaManual): Promise<any> => {
    if (!payload.items?.length) {
      throw new Error('Debe incluir al menos un item');
    }

    const items = payload.items.map((item, idx) => {
      const cantidad = Number(item.cantidad);
      const precio_venta = Number(item.precio_venta ?? item.precio_unitario ?? 0);

      if (!cantidad || cantidad <= 0) {
        throw new Error(`Item ${idx + 1}: cantidad inválida`);
      }
      if (!precio_venta || precio_venta <= 0) {
        throw new Error(`Item ${idx + 1}: precio_venta inválido`);
      }

      return {
        producto_id: item.producto_id?.trim() || undefined,
        cantidad,
        precio_venta,
        precio_costo_personalizado: item.precio_costo_personalizado,
      };
    });

    const body = {
      items,
      total: payload.total,
      nombre_comprador: payload.nombre_comprador?.trim(),
      metodo_pago: payload.metodo_pago || 'Efectivo',
      notas: payload.notas,
      factura: payload.factura || false,
    };

    try {
      const { data } = await ventasClient.post('/ventas-manuales', body);
      return data;
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Registrar venta con carrito (módulo móvil/escáner)
   */
  registrarVentaConCarrito: async (payload: RegistrarVentaPayload): Promise<any> => {
    if (!payload.productos?.length) {
      throw new Error('El carrito está vacío');
    }

    const comprador = (payload.cliente || payload.nombre_comprador)?.trim();
    if (!comprador) {
      throw new Error('cliente es requerido');
    }

    const productos = payload.productos.map((p, idx) => {
      const id = p.id?.trim();
      const cantidad = Number(p.cantidad);

      if (!id) {
        throw new Error(`Producto ${idx + 1}: id inválido`);
      }
      if (!cantidad || cantidad <= 0) {
        throw new Error(`Producto ${idx + 1}: cantidad inválida`);
      }

      return { id, cantidad };
    });

    const body = {
      productos,
      cliente: comprador,
      metodo_pago: payload.metodo_pago || 'Efectivo',
      notas: payload.notas,
    };

    try {
      const { data } = await ventasClient.post('/ventas/registrar', body);
      return data;
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Exportar ventas minoristas a Excel
   */
  exportarExcelMinoristas: async (): Promise<Blob> => {
    const { data } = await ventasClient.get('/ventas/minoristas/exportar-excel', {
      responseType: 'blob',
    });
    return data as Blob;
  },
};
