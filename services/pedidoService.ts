import { API_CONFIG } from '../config/api.js';
import { fetchWithTimeout } from './httpUtils';

export interface PedidoItemPayload {
  producto_id: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
}

export interface PedidoConsumidorPayload {
  nombre: string;
  email: string;
  telefono?: string;
  direccion?: string;
  // items pueden venir del carrito con distintas formas; los normalizamos aquí
  items: Array<{
    producto_id?: string;
    id?: string;
    nombre?: string;
    cantidad?: number;
    precio_unitario?: number;
    precio?: number;
  }>;
  total?: number;
  enviar_correo?: boolean; // Parámetro para indicar si se debe enviar correo
}

export interface PedidoConsumidorResponse {
  mensaje?: string;
  id?: string;
  [key: string]: any;
}

function buildItems(items: PedidoConsumidorPayload['items']): PedidoItemPayload[] {
  return (items ?? []).map((it: any) => ({
    producto_id: it.producto_id ?? it.id ?? '',
    nombre: it.nombre ?? 'Producto',
    cantidad: Number(it.cantidad ?? 1),
    precio_unitario: Number(it.precio_unitario ?? it.precio ?? 0),
  }));
}

export const pedidoService = {
  registrarPedidoConsumidor: async (
    payload: PedidoConsumidorPayload
  ): Promise<PedidoConsumidorResponse> => {
    const BASE = (API_CONFIG?.BASE_URL || 'https://mi-tienda-backend-o9i7.onrender.com').trim();
    const url = `${BASE}/usuarios/pedido-consumidor`;

    const items = buildItems(payload.items);
    const total = typeof payload.total === 'number'
      ? payload.total
      : items.reduce((sum, p) => sum + p.cantidad * p.precio_unitario, 0);

    // Limpieza defensiva del email por si viene con comillas/espacios
    const cleanEmail = String(payload.email || '').replace(/^"|"+$/g, '').trim();

    const body = {
      nombre: payload.nombre,
      email: cleanEmail,
      telefono: payload.telefono,
      direccion: payload.direccion,
      items,
      total,
      enviar_correo: true, // Asegurarse de que se envíe el correo
    };

    try {
      console.log('Enviando pedido a:', url);
      console.log('Payload:', JSON.stringify(body));

      // Wake-up de Render antes del POST (evita timeouts en el primer hit)
      try { await fetchWithTimeout(`${BASE}/`, { method: 'GET', timeoutMs: 60000 }); } catch {}

      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        mode: 'cors',
        timeoutMs: 60000,
      });

      console.log('Respuesta status:', response.status);

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        console.error('Error en respuesta:', data);
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
      }

      console.log('Respuesta exitosa:', data);
      return data;
    } catch (error) {
      console.error('Error en registrarPedidoConsumidor:', error);
      throw error;
    }
  },
};

export type { PedidoConsumidorPayload as PedidoConsumidorPayloadType };
