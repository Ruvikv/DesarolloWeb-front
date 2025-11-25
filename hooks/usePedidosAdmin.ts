import { useEffect, useState } from 'react';
import { pedidosAdminService, Pedido, EstadoPedido } from '../services/pedidosAdminService';
import { prewarmService } from '../services/prewarmService';

export function usePedidosAdmin() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);

  const cargarPedidos = async () => {
    try {
      setLoading(true);
      setError(null);
      // Precalentamiento para evitar 5xx en Render y errores CORS por falta de headers
      try { await prewarmService.warmupBackend(); } catch {}
      const data = await pedidosAdminService.listar();
      setPedidos(data);
    } catch (e: any) {
      console.error('Error al cargar pedidos:', e);
      const msg = e?.response?.data?.message || e?.message || 'Error al cargar pedidos';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const actualizarEstado = async (id: string, estado: EstadoPedido, entregaManual?: boolean) => {
    try {
      setActualizandoId(id);
      setError(null);
      const data = await pedidosAdminService.actualizarEstado(id, estado, entregaManual);
      await cargarPedidos();
      return { success: true, data };
    } catch (e: any) {
      console.error('Error al actualizar estado:', e);
      const msg = e?.response?.data?.message || e?.message || 'Error al actualizar pedido';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setActualizandoId(null);
    }
  };

  const actualizarEstadoConVideo = async (
    id: string,
    estado: EstadoPedido,
    video?: File | Blob | { uri: string; name?: string; type?: string },
    noGuardarVideoEnBd?: boolean
  ) => {
    try {
      setActualizandoId(id);
      setError(null);
      const data = await pedidosAdminService.actualizarEstadoConVideo(id, estado, video, noGuardarVideoEnBd);
      await cargarPedidos();
      return { success: true, data };
    } catch (e: any) {
      console.error('Error al actualizar estado con video:', e);
      const msg = e?.response?.data?.message || e?.message || 'Error al actualizar pedido';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setActualizandoId(null);
    }
  };

  useEffect(() => {
    cargarPedidos();
  }, []);

  return {
    pedidos,
    loading,
    error,
    actualizandoId,
    cargarPedidos,
    actualizarEstado,
    actualizarEstadoConVideo,
    clearError: () => setError(null),
  };
}