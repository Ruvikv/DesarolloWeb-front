import * as React from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter, type Href } from 'expo-router';
import { Platform } from 'react-native';

type NotificationData = {
  route?: string;
  path?: string;
  screen?: string;
  // Permitir parámetros adicionales en data
  [key: string]: any;
};

// Mapea claves comunes a rutas existentes de la app
function resolveRoute(input: string | undefined, data?: NotificationData): string {
  const raw = (input || '').trim().toLowerCase();
  if (!raw) return '/dashboard';

  // Si viene una ruta absoluta válida, úsala tal cual
  if (raw.startsWith('/')) return raw;

  const map: Record<string, string> = {
    'dashboard': '/dashboard',
    'panel': '/dashboard',
    'home': '/home/inicio',
    'inicio': '/home/inicio',
    'pedidos': '/pedidos/admin',
    'orders': '/pedidos/admin',
    'productos': '/productos',
    'catalogo': '/catalogo/visual',
    'catalogo-admin': '/catalogo/visual-admin',
    'precios': '/precios/lista',
    'carrito': '/carrito',
    'compras': '/compras',
    'ventas': '/ventas',
    'estadisticas': '/estadisticas',
    'configuracion': '/configuracion',
  };

  // Permitir construir rutas con parámetros simples
  if (raw === 'producto' && data?.id) {
    return `/catalogo/${String(data.id)}`;
  }

  return map[raw] || '/dashboard';
}

export default function NotificationNavigator() {
  const router = useRouter();

  React.useEffect(() => {
    // En web, el soporte de expo-notifications es limitado pero mantenemos el listener sin romper
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      try {
        const data = (response?.notification?.request?.content?.data || {}) as NotificationData;
        const input = data.route || data.path || data.screen;
        const target = resolveRoute(input, data);
        // Asegurar tipo para expo-router
        router.push(target as Href);
      } catch (e) {
        console.warn('[NotificationNavigator] navigation error:', e);
      }
    });

    return () => {
      try { sub.remove(); } catch {}
    };
  }, [router]);

  // No renderiza UI, solo gestiona navegación por respuesta de notificación
  return null;
}

