import * as Clipboard from 'expo-clipboard';
import { Platform, Share } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://mi-tienda-backend-o9i7.onrender.com';

export interface ProductoParaCompartir {
    id: string;
    nombre: string;
    precio_final?: number;
    imagen_principal?: string;
}

export type FormatoCompartir = 'texto' | 'imagen' | 'link';

export interface RespuestaCompartir {
    texto: string;
    imagenes: string[];
    links: string[];
    productos_procesados: number;
    productos_solicitados: number;
}

/**
 * Llama al endpoint del backend para generar contenido compartible
 */
export async function generarContenidoCompartir(
    productosIds: string[],
    formato: FormatoCompartir = 'texto'
): Promise<RespuestaCompartir> {
    try {
        const response = await fetch(`${API_URL}/productos/compartir`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                productosIds,
                formato,
            }),
        });

        if (!response.ok) {
            throw new Error('Error al generar contenido para compartir');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error en generarContenidoCompartir:', error);
        throw error;
    }
}

/**
 * Comparte productos usando la API nativa del dispositivo
 * Funciona en móvil y web (con fallback)
 */
export async function compartirProductos(
    productosIds: string[],
    opciones?: {
        incluirImagenes?: boolean;
        mensajePersonalizado?: string;
    }
): Promise<{ success: boolean; message: string }> {
    try {
        if (productosIds.length === 0) {
            return { success: false, message: 'No hay productos seleccionados' };
        }

        // Generar contenido desde el backend
        const contenido = await generarContenidoCompartir(productosIds, 'texto');

        // Preparar mensaje
        let mensaje = opciones?.mensajePersonalizado
            ? `${opciones.mensajePersonalizado}\n\n${contenido.texto}`
            : contenido.texto;

        // Agregar links al final
        if (contenido.links.length > 0) {
            mensaje += '\n\n🔗 Ver productos:\n' + contenido.links.join('\n');
        }

        // MÓVIL: Usar Share API nativa
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
            const result = await Share.share({
                message: mensaje,
                title: '🛍️ Productos de nuestra tienda',
            });

            if (result.action === Share.sharedAction) {
                return { success: true, message: 'Compartido exitosamente' };
            } else {
                return { success: false, message: 'Compartir cancelado' };
            }
        }

        // WEB: Usar Web Share API o copiar al portapapeles
        if (Platform.OS === 'web') {
            // Intentar Web Share API (disponible en navegadores modernos)
            if (navigator.share) {
                await navigator.share({
                    title: '🛍️ Productos de nuestra tienda',
                    text: mensaje,
                });
                return { success: true, message: 'Compartido exitosamente' };
            } else {
                // Fallback: Copiar al portapapeles
                await Clipboard.setStringAsync(mensaje);
                return {
                    success: true,
                    message: 'Texto copiado al portapapeles. Pégalo donde quieras compartir.'
                };
            }
        }

        return { success: false, message: 'Plataforma no soportada' };
    } catch (error) {
        console.error('Error al compartir productos:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Error al compartir'
        };
    }
}

/**
 * Copia el texto de productos al portapapeles
 * Útil para web o como alternativa
 */
export async function copiarProductosAlPortapapeles(
    productosIds: string[]
): Promise<{ success: boolean; message: string }> {
    try {
        const contenido = await generarContenidoCompartir(productosIds, 'texto');

        let mensaje = contenido.texto;
        if (contenido.links.length > 0) {
            mensaje += '\n\n🔗 Ver productos:\n' + contenido.links.join('\n');
        }

        await Clipboard.setStringAsync(mensaje);

        return {
            success: true,
            message: '✅ Texto copiado al portapapeles'
        };
    } catch (error) {
        console.error('Error al copiar:', error);
        return {
            success: false,
            message: 'Error al copiar al portapapeles'
        };
    }
}

/**
 * Comparte un solo producto (método simplificado)
 */
export async function compartirProducto(
    productoId: string,
    producto?: ProductoParaCompartir
): Promise<{ success: boolean; message: string }> {
    return compartirProductos([productoId]);
}

/**
 * Genera un mensaje de WhatsApp con productos
 */
export function generarMensajeWhatsApp(
    texto: string,
    numeroWhatsApp?: string
): string {
    const mensajeCodificado = encodeURIComponent(texto);

    if (numeroWhatsApp) {
        // Enviar a número específico
        return `https://wa.me/${numeroWhatsApp}?text=${mensajeCodificado}`;
    } else {
        // Abrir WhatsApp sin destinatario
        return `https://wa.me/?text=${mensajeCodificado}`;
    }
}
