import { Ionicons } from "@expo/vector-icons";
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import type { Href } from "expo-router";
import { Link, usePathname, useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import React, { useEffect } from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import NotificationNavigator from "../components/NotificationNavigator";
import NotificationPanel from "../components/NotificationPanel";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { CartProvider, useCart } from "../contexts/CartContext";
import { NotificationProvider, useNotification } from "../contexts/NotificationsContext";
import { SettingsProvider, useHeaderTheme, useThemeColors } from "../contexts/SettingsContext";
import { authService } from "../services/authService";
import { configureNotifications, ensureDefaultSchedules } from "../services/notificationsService";
// Push notifications: registro manejado por NotificationProvider
import { useResponsive } from "../utils/responsiveUtils";

function BackButton({ color = '#000' }: { color?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const isPedidosAdmin = !!(pathname && pathname.startsWith('/pedidos'));
  const isCatalogAdmin = !!(pathname && pathname.startsWith('/catalogo'));
  const isPrecios = !!(pathname && pathname.startsWith('/precios'));
  const isProductos = !!(pathname && pathname.startsWith('/productos'));
  const isVentas = !!(pathname && pathname.startsWith('/ventas'));

  // En pantallas admin específicas, usar Link para navegar confiablemente al Panel
  if (isPedidosAdmin || isCatalogAdmin || isPrecios || isProductos || isVentas) {
    return (
      <Link href="/dashboard" asChild>
        <TouchableOpacity style={{ marginRight: 10 }}>
          <Ionicons name="arrow-back" size={24} color={color} />
        </TouchableOpacity>
      </Link>
    );
  }
  return (
    <TouchableOpacity
      onPress={() => {
        try {
          // Usar back si hay historial, si no, fallback al Panel
          const hasHistory = typeof window !== 'undefined' && window.history && window.history.length > 1;
          // @ts-ignore canGoBack puede existir en navegadores nativos
          const canGoBack = typeof router.canGoBack === 'function' ? router.canGoBack() : false;
          if (hasHistory || canGoBack) {
            router.back();
          } else {
            router.push('/dashboard' as Href<'/dashboard'>);
          }
        } catch {
          router.push('/dashboard' as Href<'/dashboard'>);
        }
      }}
      style={{ marginRight: 10 }}
    >
      <Ionicons name="arrow-back" size={24} color={color} />
    </TouchableOpacity>
  );
}

function CartButton({ color = '#000' }: { color?: string }) {
  const router = useRouter();
  const { totalItems } = useCart();
  return (
    <TouchableOpacity onPress={() => router.push('/carrito')} style={{ marginLeft: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name="cart-outline" size={24} color={color} />
        {totalItems > 0 && (
          <View style={{
            marginLeft: 6,
            backgroundColor: '#7b1fa2',
            borderRadius: 10,
            paddingHorizontal: 6,
            paddingVertical: 2
          }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{totalItems}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function BellButton({ color = '#000' }: { color?: string }) {
  const { unreadCount } = useNotification();
  const [panelVisible, setPanelVisible] = React.useState(false);

  return (
    <>
      <TouchableOpacity onPress={() => setPanelVisible(true)} style={{ marginLeft: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="notifications-outline" size={24} color={color} />
          {unreadCount > 0 && (
            <View style={{
              position: 'absolute',
              top: -4,
              right: -4,
              backgroundColor: '#d32f2f',
              borderRadius: 10,
              minWidth: 20,
              height: 20,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 4,
            }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 10 }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      <NotificationPanel visible={panelVisible} onClose={() => setPanelVisible(false)} />
    </>
  );
}

function LogoutButton({ color = '#000' }: { color?: string }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isMobile } = useResponsive();

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/auth/login');
    } catch (e) {
      console.error('Error al cerrar sesión:', e);
    }
  };

  return (
    <TouchableOpacity onPress={handleLogout} style={{ marginLeft: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name="log-out-outline" size={24} color={color} />
        {!isMobile && (
          <Text style={{ marginLeft: 6, fontSize: 14, color }}>Cerrar sesión</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function DrawerLayout() {
  const { user, token, isLoading } = useAuth();
  const { headerStyle, headerTintColor } = useHeaderTheme();
  const colors = useThemeColors();
  useEffect(() => {
    console.log('[DrawerLayout] mounted, user:', user ? 'yes' : 'no');
  }, [user]);

  // Inicializar/cancelar notificaciones según token (solo cuando hay sesión)
  useEffect(() => {
    (async () => {
      try {
        if (token) {
          const granted = await configureNotifications();
          if (granted) {
            let isAdmin = false;
            try {
              const profile = await authService.getProfile();
              const role = (profile?.rol ?? profile?.role ?? '').toString().toUpperCase();
              isAdmin = role.includes('ADMIN');
            } catch { }

            if (isAdmin) {
              await ensureDefaultSchedules();
              // Registrar tarea de fondo solo en plataformas nativas
              if (Platform.OS !== 'web') {
                try {
                  const { registerStockBackgroundTask } = await import('../tasks/stockBackground');
                  await registerStockBackgroundTask();
                } catch (e) {
                  console.warn('[background] register task dynamic import error:', e);
                }
              }
            } else {
              // Si no es admin, cancelar cualquiera programada y no registrar tareas de fondo
              try { await Notifications.cancelAllScheduledNotificationsAsync(); } catch { }
              if (Platform.OS !== 'web') {
                try {
                  const BackgroundFetch = await import('expo-background-fetch');
                  await BackgroundFetch.unregisterTaskAsync('STOCK_DAILY_TASK');
                } catch { }
              }
            }
          }
        } else {
          try { await Notifications.cancelAllScheduledNotificationsAsync(); } catch { }
          if (Platform.OS !== 'web') {
            try {
              const BackgroundFetch = await import('expo-background-fetch');
              await BackgroundFetch.unregisterTaskAsync('STOCK_DAILY_TASK');
            } catch { }
          }
        }
      } catch (e) {
        console.warn('[notifications] init/cancel error:', e);
      }
    })();
  }, [token]);

  // Esperar a que AuthProvider resuelva antes de montar el Drawer.
  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Verificando sesión...</Text>
      </View>
    );
  }

  const initialRoute = token ? 'dashboard' : 'auth/login';

  return (
    <Drawer initialRouteName={initialRoute} screenOptions={{
      headerStyle,
      headerTintColor,
      sceneContainerStyle: { backgroundColor: colors.background },
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
          <BackButton color={headerTintColor} />
          <BellButton color={headerTintColor} />
          <CartButton color={headerTintColor} />
          <LogoutButton color={headerTintColor} />
        </View>
      )
    }}>
      {/* Ruta index eliminada para evitar redirecciones dentro del Drawer */}
      {/* Ocultar rutas internas y no deseadas en el menú */}
      <Drawer.Screen name="index" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="productos/index" options={{ title: "Productos", drawerItemStyle: { display: 'none' } }} />
      {/* Rutas de registro ocultas del menú */}
      <Drawer.Screen name="auth/registerAdmin" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="auth/registerRevendedor" options={{ drawerItemStyle: { display: 'none' } }} />
      {/* Ocultar ruta legacy home/home para evitar duplicado */}
      <Drawer.Screen name="home/home" options={{ drawerItemStyle: { display: 'none' } }} />
      {/* Índice del grupo home para permitir redirección a /home */}
      <Drawer.Screen name="home/index" options={{ drawerItemStyle: { display: 'none' } }} />
      {/* Pantallas visibles */}
      <Drawer.Screen name="home/inicio" options={{ title: "Inicio" }} />
      <Drawer.Screen name="catalogo/visual" options={{ title: "Catálogo Público" }} />
      {/* Solo mostrar Panel si el usuario está autenticado */}
      <Drawer.Screen
        name="dashboard"
        options={{
          title: "Panel de Control",
          drawerItemStyle: token ? {} : { display: 'none' }
        }}
      />
      {/* Ocultar pantallas que solo se acceden desde el Panel */}
      <Drawer.Screen name="catalogo/visual-admin" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="catalogo/explore" options={{ title: "Explorar" }} />
      {/* Detalle de producto oculto del Drawer */}
      <Drawer.Screen name="catalogo/[id]" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="contacto/contacto" options={{ title: "Contacto" }} />
      <Drawer.Screen name="auth/login" options={{ title: "Iniciar sesión", drawerItemStyle: token ? { display: 'none' } : {} }} />
      <Drawer.Screen name="precios/lista" options={{ drawerItemStyle: { display: 'none' } }} />
      {/* Carrito visible como pantalla, acceso principal vía header; ocultamos del Drawer si prefieres */}
      <Drawer.Screen name="carrito" options={{ title: "Carrito", drawerItemStyle: { display: 'none' } }} />
      {/* Pantallas internas del Panel */}
      {/* Gestión de pedidos (oculta del Drawer) */}
      <Drawer.Screen name="pedidos/admin" options={{ title: "Atender pedidos", drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="ventas" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="configuracion" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="notificaciones" options={{ title: "Notificaciones", drawerItemStyle: { display: 'none' } }} />
      {/* Módulos administrativos - solo accesibles desde dashboard */}
      <Drawer.Screen name="compras" options={{ title: "Compras", drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="estadisticas" options={{ title: "Estadísticas", drawerItemStyle: { display: 'none' } }} />
      {/* Pantalla de éxito de pedido (navegación interna, oculta del Drawer) */}
      <Drawer.Screen name="pedido/exito" options={{ drawerItemStyle: { display: 'none' } }} />
      {/* Rutas inexistentes eliminadas para evitar warnings de expo-router */}
    </Drawer>
  );
}

export default function RootLayout() {
  const router = useRouter();
  // Cargar fuentes locales para evitar timeouts de FontFaceObserver en web
  const [fontsLoaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  React.useEffect(() => {
    Ionicons.loadFont().catch((e) => console.warn('[fonts] Ionicons loadFont error', e));
  }, []);
  // Precalentamiento del backend (Render puede tardar en despertar)
  useEffect(() => {
    // prewarmService.startWarmup();
    console.log('[RootLayout] mounted');
  }, []);

  // Inicialización de notificaciones se maneja en DrawerLayout en función del token

  return (
    <SettingsProvider>
      <AuthProvider>
        <NotificationProvider>
          <CartProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <ErrorBoundary>
                <NotificationNavigator />
                <DrawerLayout />
              </ErrorBoundary>
            </GestureHandlerRootView>
          </CartProvider>
        </NotificationProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }
  componentDidCatch(error: any) {
    console.error('[ErrorBoundary] Caught error:', error);
    this.setState({ error });
  }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <Text style={{ fontSize: 16, marginBottom: 8 }}>Se produjo un error en la app.</Text>
          <Text selectable style={{ color: '#d32f2f' }}>{String(this.state.error)}</Text>
        </View>
      );
    }
    return this.props.children as any;
  }
}
