import { fetchWithTimeout } from './httpUtils';

export interface BarcodeProduct {
  nombre: string;
  descripcion?: string;
  categoria?: string;
  marca?: string;
  imagen_url?: string;
  sku?: string;
  fuente: 'openfoodfacts' | 'upcitemdb' | 'desconocida';
}

async function buscarEnOpenFoodFacts(code: string): Promise<BarcodeProduct | null> {
  const urlV0 = `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(code)}.json`;
  try {
    const res = await fetchWithTimeout(urlV0, { method: 'GET', headers: { Accept: 'application/json' }, timeoutMs: 20000 });
    const data = await res.json().catch(() => ({}));
    if (data?.status === 1 && data?.product) {
      const p = data.product;
      return {
        nombre: p.product_name || p.brands || 'Producto',
        descripcion: p.generic_name || p.categories || p.quantity || '',
        categoria: p.categories || '',
        marca: p.brands || '',
        imagen_url: p.image_url || p.image_front_url || '',
        sku: String(code),
        fuente: 'openfoodfacts',
      };
    }
  } catch {}

  // Intento v2 como respaldo
  const urlV2 = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}`;
  try {
    const res = await fetchWithTimeout(urlV2, { method: 'GET', headers: { Accept: 'application/json' }, timeoutMs: 20000 });
    const data = await res.json().catch(() => ({}));
    const p = data?.product;
    if (p) {
      return {
        nombre: p.product_name || p.brands || 'Producto',
        descripcion: p.generic_name || p.categories || p.quantity || '',
        categoria: p.categories || '',
        marca: p.brands || '',
        imagen_url: p.image_url || p.image_front_url || '',
        sku: String(code),
        fuente: 'openfoodfacts',
      };
    }
  } catch {}
  return null;
}

async function buscarEnUpcItemDbTrial(code: string): Promise<BarcodeProduct | null> {
  const url = `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(code)}`;
  try {
    const res = await fetchWithTimeout(url, { method: 'GET', headers: { Accept: 'application/json' }, timeoutMs: 20000 });
    const data = await res.json().catch(() => ({}));
    const item = Array.isArray(data?.items) ? data.items[0] : null;
    if (item) {
      return {
        nombre: item.title || 'Producto',
        descripcion: item.description || '',
        categoria: item.category || '',
        marca: item.brand || '',
        imagen_url: Array.isArray(item.images) ? item.images[0] : '',
        sku: String(code),
        fuente: 'upcitemdb',
      };
    }
  } catch {}
  return null;
}

export const barcodeService = {
  buscarProductoGlobal: async (code: string): Promise<BarcodeProduct | null> => {
    const trimmed = String(code || '').trim();
    if (!trimmed) return null;
    const fromOff = await buscarEnOpenFoodFacts(trimmed);
    if (fromOff) return fromOff;
    const fromUpc = await buscarEnUpcItemDbTrial(trimmed);
    if (fromUpc) return fromUpc;
    return null;
  }
};