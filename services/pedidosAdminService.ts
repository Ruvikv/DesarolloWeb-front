import apiClient from './apiService';

export type EstadoPedido = 'pendiente' | 'confirmado' | 'preparando' | 'enviado' | 'entregado' | 'cancelado';

export interface PedidoItem {
  id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
}

export interface Pedido {
  id: string;
  fecha: string;
  estado: EstadoPedido;
  total: number;
  total_calculado?: number;
  observaciones?: {
    nombre?: string;
    email?: string;
    telefono?: string;
    direccion?: string;
    notas?: string;
  };
  pedido_items: PedidoItem[];
  productos?: any[];
}

export const pedidosAdminService = {
  async listar(): Promise<Pedido[]> {
    const resp = await apiClient.get('/productos/admin/pedidos');
    const data = resp.data;
    return Array.isArray(data) ? data : data?.data || [];
  },

  async obtenerPorId(id: string): Promise<Pedido> {
    const resp = await apiClient.get(`/productos/admin/pedidos/${id}`);
    return resp.data as Pedido;
  },

  async actualizarEstado(id: string, estado: EstadoPedido, entregaManual?: boolean): Promise<any> {
    const body: any = { estado };
    if (entregaManual) body.entrega_manual = true;
    const resp = await apiClient.patch(`/productos/admin/pedidos/${id}/estado`, body);
    return resp?.data;
  },

  async actualizarEstadoConVideo(
    id: string,
    estado: EstadoPedido,
    video?: File | Blob | { uri: string; name?: string; type?: string },
    noGuardarVideoEnBd?: boolean
  ): Promise<any> {
    const form = new FormData();
    form.append('estado', estado);
    if (video) {
      // En web, debe ser File/Blob para que se adjunte correctamente.
      // En RN nativo, se envía como { uri, name, type }.
      const maybeAny: any = video as any;
      if (typeof window !== 'undefined' && (maybeAny instanceof File || maybeAny instanceof Blob)) {
        form.append('video', maybeAny);
      } else {
        const fileDesc: any = {
          uri: (video as any).uri,
          name: (video as any).name || 'evidencia.mp4',
          type: (video as any).type || 'video/mp4',
        };
        form.append('video', fileDesc);
      }
    }
    // Flag para que el backend no guarde la ruta en BD
    const flag = (noGuardarVideoEnBd ?? true) ? 'true' : 'false';
    form.append('no_guardar_video_en_bd', flag);
    const resp = await apiClient.put(`/productos/admin/pedidos/${id}/estado`, form);
    return resp?.data;
  },
};