import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import React, { useEffect } from "react";
import { TouchableOpacity, View, Text } from "react-native";
import 'react-native-gesture-handler';
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { CartProvider, useCart } from "../contexts/CartContext";
import { prewarmService } from "../services/prewarmService";

function BackButton() {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 10 }}>
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
  const { user } = useAuth();

  return (
    <Drawer screenOptions={{
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
          <BackButton />
          <CartButton />
          <LogoutButton />
        </View>
      )
    }}>
      {/* Ocultar la ruta index del menú */}
      <Drawer.Screen name="index" options={{ drawerItemStyle: { display: 'none' } }} />
      {/* Ocultar ruta de productos del Drawer público */}
      <Drawer.Screen name="productos/index" options={{ drawerItemStyle: { display: 'none' } }} />
      {/* Rutas de registro ocultas del menú */}
      <Drawer.Screen name="auth/registerAdmin" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="auth/registerRevendedor" options={{ drawerItemStyle: { display: 'none' } }} />
      {/* Ocultar ruta legacy home/home para evitar duplicado */}
      <Drawer.Screen name="home/home" options={{ drawerItemStyle: { display: 'none' } }} />
      {/* Pantallas visibles */}
      <Drawer.Screen name="home/inicio" options={{ title: "Inicio" }} />
      {/* Solo mostrar Panel si el usuario está autenticado */}
      <Drawer.Screen
        name="dashboard"
        options={{
          title: "Panel de Control",
          drawerItemStyle: user ? {} : { display: 'none' }
        }}
      />
      <Drawer.Screen name="catalogo/visual" options={{ title: "Catálogo Visual" }} />
      <Drawer.Screen name="catalogo/explore" options={{ title: "Explorar" }} />
      {/* Detalle de producto oculto del Drawer */}
      <Drawer.Screen name="catalogo/[id]" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="contacto/contacto" options={{ title: "Contacto" }} />
      <Drawer.Screen name="auth/login" options={{ title: "Iniciar sesión" }} />
      <Drawer.Screen name="precios/lista" options={{ title: "Lista de Precios" }} />
      {/* Carrito visible como pantalla, acceso principal vía header; ocultamos del Drawer si prefieres */}
      <Drawer.Screen name="carrito" options={{ title: "Carrito", drawerItemStyle: { display: 'none' } }} />
      {/* Pantalla de éxito de pedido (navegación interna, oculta del Drawer) */}
      <Drawer.Screen name="pedido/exito" options={{ drawerItemStyle: { display: 'none' } }} />
      {/* Rutas inexistentes eliminadas para evitar warnings de expo-router */}
    </Drawer>
  );
}

export default function RootLayout() {
  // Precalentamiento del backend (Render puede tardar en despertar)
  useEffect(() => {
    prewarmService.startWarmup();
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <DrawerLayout />
      </CartProvider>
    </AuthProvider>
  );
}
