import { apiService } from './apiService';

export interface PedidoProductoPayload {
	producto_id: string;
	nombre?: string;
	cantidad: number;
	precio_unitario?: number;
}

export interface PedidoConsumidorPayload {
	nombre: string;
	email: string;
	telefono?: string;
	direccion?: string;
	productos: PedidoProductoPayload[];
	total: number;
}

export interface PedidoConsumidorResponse {
	success?: boolean;
	message?: string;
	[id: string]: any;
}

export const pedidoService = {
	registrarPedidoConsumidor: async (
		payload: PedidoConsumidorPayload
	): Promise<PedidoConsumidorResponse> => {
		return apiService.post<PedidoConsumidorResponse>(
			'/usuarios/pedido-consumidor',
			payload,
			{ headers: { 'x-skip-auth': '1' } }
		);
	},
};
