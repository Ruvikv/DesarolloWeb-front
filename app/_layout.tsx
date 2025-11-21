import 'react-native-gesture-handler';
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from 'expo-font';
import { useRouter, usePathname, Link } from "expo-router";
import type { Href } from "expo-router";
import { Drawer } from "expo-router/drawer";
import React, { useEffect } from "react";
import { InteractionManager } from 'react-native';
import { TouchableOpacity, View, Text } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { CartProvider, useCart } from "../contexts/CartContext";
import { prewarmService } from "../services/prewarmService";

function BackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const isPedidosAdmin = !!(pathname && pathname.startsWith('/pedidos'));
  const isCatalogAdmin = !!(pathname && pathname.startsWith('/catalogo'));
  const isPrecios = !!(pathname && pathname.startsWith('/precios'));
  const isProductos = !!(pathname && pathname.startsWith('/productos'));

  // En pantallas admin específicas, usar Link para navegar confiablemente al Panel
  if (isPedidosAdmin || isCatalogAdmin || isPrecios || isProductos) {
    return (
      <Link href="/dashboard" asChild>
        <TouchableOpacity style={{ marginRight: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#000" />
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
      <Ionicons name="arrow-back" size={24} color="#000" />
    </TouchableOpacity>
  );
}

function CartButton() {
  const router = useRouter();
  const { totalItems } = useCart();
  return (
    <TouchableOpacity onPress={() => router.push('/carrito')} style={{ marginLeft: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name="cart-outline" size={24} color="#000" />
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

function LogoutButton() {
  const router = useRouter();
  const { user, logout } = useAuth();

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
        <Ionicons name="log-out-outline" size={24} color="#000" />
        <Text style={{ marginLeft: 6, fontSize: 14, color: '#000' }}>Cerrar sesión</Text>
      </View>
    </TouchableOpacity>
  );
}

function DrawerLayout() {
  const { user, token, isLoading } = useAuth();
  useEffect(() => {
    console.log('[DrawerLayout] mounted, user:', user ? 'yes' : 'no');
  }, [user]);

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
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
          <BackButton />
          <CartButton />
          <LogoutButton />
        </View>
      )
    }}>
      {/* Ruta index eliminada para evitar redirecciones dentro del Drawer */}
      {/* Ocultar rutas internas y no deseadas en el menú */}
      <Drawer.Screen name="index" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="productos/index" options={{ drawerItemStyle: { display: 'none' } }} />
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

  return (
    <AuthProvider>
      <CartProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ErrorBoundary>
            <DrawerLayout />
          </ErrorBoundary>
        </GestureHandlerRootView>
      </CartProvider>
    </AuthProvider>
  );
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: any }>{
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
