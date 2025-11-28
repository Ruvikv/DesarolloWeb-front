import * as Clipboard from 'expo-clipboard';
import { Platform, Share } from 'react-native';
import { API_CONFIG } from '../config/api.js';

// Usar la misma BASE_URL centralizada para evitar incongruencias (p.ej. localhost:3000)
const API_URL = API_CONFIG.BASE_URL;

// Normaliza posibles duplicaciones en rutas y asegura http(s)
function sanitizeImageUrl(input: any): string {
    try {
        if (typeof input !== 'string') return '';
        let fixed = input.trim();
        while (fixed.includes('product-images/product-images/')) {
            fixed = fixed.replace('product-images/product-images/', 'product-images/');
        }
        if (!/^https?:\/\//i.test(fixed)) return '';
        return fixed;
    } catch {
        return '';
    }
}

function resolveFrontProductLink(id: string): string {
    try {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            const origin = window.location.origin.replace(/\/$/, '');
            return `${origin}/catalogo/${id}`;
        }
        const site = (() => {
            try {
                const p = (globalThis as any)?.process;
                const v = p?.env?.EXPO_PUBLIC_SITE_URL;
                return typeof v === 'string' ? v : '';
            } catch { return ''; }
        })().replace(/\/$/, '');
        if (site) return `${site}/catalogo/${id}`;
    } catch {}
    return `/catalogo/${id}`;
}

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

// Construye URL pública del share del backend
export function getShareUrl(productoId: string): string {
    const base = API_URL.replace(/\/+$/, '');
    return `${base}/share/producto/${productoId}`;
}

// Mensaje estilo frontend (localhost) solicitado
function buildFrontendShareMessage(ids: string[]): { text: string; links: string[] } {
    const links = ids.map((id) => resolveFrontProductLink(id));
    let text = '🛍 Productos seleccionados\n\n';
    ids.forEach((id, i) => {
        const link = links[i];
        text += `• Producto ${id}\n`;
        text += `🛒 Comprar: ${link}\n\n`;
    });
    text += '🔗 Ver productos:\n' + links.join('\n');
    return { text: text.trim(), links };
}

// Abrir WhatsApp Web con el texto prellenado (preserva emojis y saltos)
function openWhatsAppWeb(text: string): void {
    try {
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            window.open(url, '_blank');
        }
    } catch {}
}

/**
 * Llama al endpoint del backend para generar contenido compartible
 */
export async function generarContenidoCompartir(
    productosIds: string[],
    formato: FormatoCompartir = 'texto'
): Promise<RespuestaCompartir> {
    try {
        const base = Platform.OS === 'web' ? '/api' : API_URL.replace(/\/$/, '');
        const response = await fetch(`${base}/productos/compartir`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // En web, indicar salto de auth para evitar preflight complejo en dev-proxy
                ...(Platform.OS === 'web' ? { 'x-skip-auth': '1', Accept: 'application/json' } : { Accept: 'application/json' }),
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

        // Intentar generar contenido desde el backend
        let contenido: RespuestaCompartir | null = null;
        try {
            contenido = await generarContenidoCompartir(productosIds, 'texto');
        } catch (err) {
            // Fallback: construir texto localmente
            const lines: string[] = [];
            const shareLinks: string[] = [];
            const base = Platform.OS === 'web' ? '/api' : API_URL.replace(/\/$/, '');
            for (const id of productosIds) {
                try {
                    const r = await fetch(`${base}/catalogo/producto/${id}`, {
                        method: 'GET',
                        headers: { Accept: 'application/json', ...(Platform.OS === 'web' ? { 'x-skip-auth': '1' } : {}) },
                        mode: Platform.OS === 'web' ? 'cors' : undefined as any,
                    });
                    if (r.ok) {
                        const p = await r.json();
                        const nombre = p?.nombre ?? p?.name ?? `Producto ${id}`;
                        const precio = p?.precio_final ?? p?.precios_productos?.[0]?.precio_final;
                        const link = getShareUrl(id);
                        shareLinks.push(link);
                        let line = `• ${nombre}`;
                        if (precio) line += ` — ${formatMoney(precio)}`;
                        // URL sola en línea para que WhatsApp la detecte como enlace
                        line += `\n${link}`;
                        lines.push(line);
                    } else {
                        const link = getShareUrl(id);
                        shareLinks.push(link);
                        lines.push(`• Producto ${id}\n${link}`);
                    }
                } catch {
                    const link = getShareUrl(id);
                    shareLinks.push(link);
                    lines.push(`• Producto ${id}\n${link}`);
                }
            }
            let texto = `🛍️ Productos seleccionados\n\n` + lines.join('\n\n');
            if (shareLinks.length > 1) {
                texto += `\n\n🔗 Ver productos:\n` + shareLinks.join('\n');
            }
            contenido = {
                texto,
                imagenes: [],
                links: shareLinks,
                productos_procesados: productosIds.length,
                productos_solicitados: productosIds.length,
            };
        }

        // Preparar mensaje en formato solicitado (frontend localhost)
        const built = buildFrontendShareMessage(productosIds);
        let mensaje = opciones?.mensajePersonalizado
            ? `${opciones.mensajePersonalizado}\n\n${built.text}`
            : built.text;

        // MÓVIL: Usar Share API nativa
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
            const result = await Share.share({
                message: mensaje,
                title: '🛍️ Productos de nuestra tienda',
                url: built.links[0] ? built.links[0] : undefined as any,
            });

            if (result.action === Share.sharedAction) {
                return { success: true, message: 'Compartido exitosamente' };
            } else {
                return { success: false, message: 'Compartir cancelado' };
            }
        }

        // WEB: Usar Web Share API o copiar al portapapeles
        if (Platform.OS === 'web') {
            // Abrir WhatsApp Web con el mensaje completo (mejor preserva emojis y formato)
            openWhatsAppWeb(mensaje);
            return { success: true, message: 'WhatsApp Web abierto con el mensaje' };
        }

        return { success: false, message: 'Plataforma no soportada' };
    } catch (error) {
        console.error('Error al compartir productos:', error);
        // Fallback final: copiar IDs al portapapeles
        try {
            const texto = `🛍️ Productos seleccionados: ${productosIds.join(', ')}`;
            await Clipboard.setStringAsync(texto);
            return { success: true, message: 'Texto copiado al portapapeles' };
        } catch {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Error al compartir'
            };
        }
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
    const built = buildFrontendShareMessage([productoId]);
    const mensaje = built.text;
    try {
        if (Platform.OS === 'web') {
            openWhatsAppWeb(mensaje);
            return { success: true, message: 'WhatsApp Web abierto con el mensaje' };
        }
        const result = await Share.share({ message: mensaje });
        if (result.action === Share.sharedAction) {
            return { success: true, message: 'Compartido exitosamente' };
        }
        return { success: false, message: 'Compartir cancelado' };
    } catch {
        await Clipboard.setStringAsync(built.links[0]);
        return { success: false, message: 'Se copió el link al portapapeles' };
    }
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
function formatMoney(value: any): string {
    try {
        const num = Number(value);
        if (!isFinite(num)) return '';
        return num.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
    } catch { return `$${value}`; }
}
