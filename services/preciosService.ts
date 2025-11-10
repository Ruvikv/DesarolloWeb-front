import { apiService } from './apiService';

export type AjusteGlobal = { valor: number } | null;

export const preciosService = {
  getAjustePrecioCosto: async (): Promise<AjusteGlobal> => {
    return await apiService.get<AjusteGlobal>('/precios/ajuste-precio-costo');
  },

  actualizarAjustePrecioCosto: async (valor: number): Promise<{ ok: boolean } | any> => {
    // Algunos backends responden {success,data}, otros {ok}. Devolvemos lo que llegue.
    return await apiService.patch('/precios/ajuste-precio-costo', { valor });
  },

  generarPreciosConsumidorFinal: async (): Promise<{ ok: boolean } | any> => {
    return await apiService.post('/precios/generar-consumidor-final', {});
  },

  generarPreciosMayoristas: async (): Promise<{ ok: boolean } | any> => {
    return await apiService.post('/precios/generar-mayoristas', {});
  },

  obtenerPreciosMayoristas: async (): Promise<any[]> => {
    const res = await apiService.get<any[]>('/precios/mayoristas');
    return Array.isArray(res) ? res : (res as any)?.data ?? [];
  },

  obtenerProductosConGanancia: async (): Promise<any[]> => {
    const res = await apiService.get<any[]>('/productos?conGanancia=true');
    return Array.isArray(res) ? res : (res as any)?.data ?? [];
  },

  getPrecioMayoristaSugerido: async (productoId: string | number): Promise<any> => {
    return await apiService.get<any>(`/ventas/mayoristas/precio-sugerido/${productoId}`);
  }
};