import { Drawer } from "expo-router/drawer";
import React, { useEffect } from "react";
import 'react-native-gesture-handler';
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { CartProvider } from "../contexts/CartContext";
import { prewarmService } from "../services/prewarmService";
import { useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

function BackButton() {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 10 }}>
      <Ionicons name="arrow-back" size={24} color="#000" />
    </TouchableOpacity>
  );
}

function DrawerLayout() {
  const { user } = useAuth();

  return (
    <Drawer screenOptions={{ headerRight: () => <BackButton /> }}>
      {/* Ocultar la ruta index del menú */}
      <Drawer.Screen name="index" options={{ drawerItemStyle: { display: 'none' } }} />
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
      {/* Carrito desde rama main */}
      <Drawer.Screen name="carrito" options={{ title: "Carrito" }} />
      {/* Pantallas de administración ocultas del Drawer público */}
      <Drawer.Screen name="compras" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="revendedores" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="estadisticas" options={{ drawerItemStyle: { display: 'none' } }} />
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
