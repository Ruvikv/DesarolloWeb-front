import axios, { AxiosInstance } from 'axios';
import { API_CONFIG } from '../config/api.js';
import { safeAsyncStorage } from './storageUtils';

const API_BASE_URL = API_CONFIG.BASE_URL;

// Cliente axios para resumen económico
export const resumenEconomicoClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000, // Aumentado a 60s para manejar cold start de Render
});

// ============================================
// INTERCEPTORS
// ============================================

// Interceptor para agregar el token
resumenEconomicoClient.interceptors.request.use(
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

            console.log(`[resumenEconomicoClient] ${config.method?.toUpperCase()} ${config.url}`);
        } catch (e) {
            console.warn('[resumenEconomicoClient] Error en interceptor:', e);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor de respuesta
resumenEconomicoClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error?.response?.status;
        const url = error?.config?.url || '';
        const data = error?.response?.data;

        console.error(`[resumenEconomicoClient] Error ${status || 'desconocido'} en ${url}:`, data || error.message);

        if (status === 401) {
            await safeAsyncStorage.removeItem('authToken');
        }

        return Promise.reject(error);
    }
);

// ============================================
// INTERFACES
// ============================================

export interface DesgloseVentas {
    ventas_manuales: number;
    ventas_minoristas: number;
    ventas_mayoristas: number;
}

export interface EstadisticasDashboard {
    ingresos_totales: number;
    productos_activos: number;
    alertas_stock: number;
    desglose_ventas: DesgloseVentas;
    ganancia_total: number;
    total_compras: number;
}

// ============================================
// SERVICIO
// ============================================

export const resumenEconomicoService = {
    /**
     * Obtener estadísticas para el dashboard
     */
    obtenerEstadisticasDashboard: async (): Promise<EstadisticasDashboard> => {
        console.log('[resumenEconomicoService] Solicitando estadísticas del dashboard...');

        try {
            const { data } = await resumenEconomicoClient.get('/resumen-economico/dashboard');

            // El backend devuelve { mensaje, resumen }
            const resumen = data?.resumen || data;

            console.log('[resumenEconomicoService] Estadísticas recibidas:', resumen);

            return {
                ingresos_totales: resumen.ingresos_totales || 0,
                productos_activos: resumen.productos_activos || 0,
                alertas_stock: resumen.alertas_stock || 0,
                desglose_ventas: resumen.desglose_ventas || {
                    ventas_manuales: 0,
                    ventas_minoristas: 0,
                    ventas_mayoristas: 0,
                },
                ganancia_total: resumen.ganancia_total || 0,
                total_compras: resumen.total_compras || 0,
            };
        } catch (error: any) {
            console.error('[resumenEconomicoService] Error al obtener estadísticas:', error);
            const errorMsg = error?.response?.data?.message || 'Error al obtener estadísticas';
            throw new Error(errorMsg);
        }
    },
};
