import axios, { AxiosInstance } from 'axios';
import { API_CONFIG } from '../config/api.js';
import { safeAsyncStorage } from './storageUtils';

const API_BASE_URL = API_CONFIG.BASE_URL;

// Cliente axios para compras
export const comprasClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
});

// ============================================
// INTERCEPTORS
// ============================================

comprasClient.interceptors.request.use(
    async (config) => {
        try {
            const token = await safeAsyncStorage.getItem('authToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            // Configurar Content-Type para POST/PATCH/PUT
            if (config.method && ['post', 'patch', 'put'].includes(config.method.toLowerCase())) {
                config.headers['Content-Type'] = 'application/json';
            }

            // Remover Content-Type para requests GET
            if (config.method?.toLowerCase() === 'get') {
                delete config.headers['Content-Type'];
                delete config.headers['content-type'];
            }

            console.log(`[comprasClient] ${config.method?.toUpperCase()} ${config.url}`);
        } catch (e) {
            console.warn('[comprasClient] Error en interceptor de request:', e);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

comprasClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error?.response?.status;
        const url = error?.config?.url || '';
        const data = error?.response?.data;

        console.error(`[comprasClient] Error ${status || 'desconocido'} en ${url}:`, data || error.message);

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

export interface CompraItemInput {
    id?: string; // client-side id (opcional para envío al backend)
    nombre?: string;
    producto_id?: string;
    cantidad: number;
    precio_unitario: number;
}

export interface CompraItemDetalle {
    cantidad: number;
    precio_unitario: number;
    productos?: { id: string; nombre: string } | null;
    producto_id?: string;
}

export interface CompraListado {
    id: string;
    fecha: string;
    proveedor: string;
    observaciones?: string;
    compra_items?: CompraItemDetalle[];
}

export interface RegistrarCompraPayload {
    proveedor: string;
    observaciones?: string;
    productos: Array<{
        nombre?: string;
        producto_id?: string;
        cantidad: number;
        precio_unitario: number;
    }>;
}

// ============================================
// SERVICIO
// ============================================

export const comprasService = {
    /**
     * Listar todas las compras
     */
    listarCompras: async (): Promise<CompraListado[]> => {
        const { data } = await comprasClient.get('/compras');
        return normalizeArrayPayload<CompraListado>(data);
    },

    /**
     * Registrar una nueva compra
     */
    registrarCompra: async (payload: RegistrarCompraPayload): Promise<any> => {
        // Validación básica
        if (!payload.proveedor?.trim()) {
            throw new Error('Proveedor es requerido');
        }

        if (!payload.productos?.length) {
            throw new Error('Debe agregar al menos un producto');
        }

        // Validar cada producto
        payload.productos.forEach((prod, idx) => {
            const tieneIdentificador = (prod.nombre && prod.nombre.trim()) || (prod.producto_id && prod.producto_id.trim());
            if (!tieneIdentificador) {
                throw new Error(`Producto ${idx + 1}: debe tener nombre o producto_id`);
            }
            if (!prod.cantidad || prod.cantidad <= 0) {
                throw new Error(`Producto ${idx + 1}: cantidad debe ser mayor a 0`);
            }
            if (prod.precio_unitario == null || prod.precio_unitario < 0) {
                throw new Error(`Producto ${idx + 1}: precio_unitario debe ser >= 0`);
            }
        });

        const body = {
            proveedor: payload.proveedor.trim(),
            observaciones: payload.observaciones?.trim() || undefined,
            productos: payload.productos.map((p) => ({
                nombre: p.nombre?.trim() || undefined,
                producto_id: p.producto_id?.trim() || undefined,
                cantidad: Number(p.cantidad),
                precio_unitario: Number(p.precio_unitario),
            })),
        };

        console.log('[comprasService] Enviando compra:', JSON.stringify(body, null, 2));

        try {
            const { data } = await comprasClient.post('/compras', body);
            console.log('[comprasService] Compra registrada exitosamente:', data);
            return data;
        } catch (error: any) {
            console.error('[comprasService] Error al registrar compra:', error);
            const errorMsg = getErrorMessage(error);
            console.error('[comprasService] Mensaje de error:', errorMsg);
            throw new Error(errorMsg);
        }
    },
};
