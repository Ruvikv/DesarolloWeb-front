import { Drawer } from "expo-router/drawer";
import React, { useEffect } from "react";
import 'react-native-gesture-handler';
import { AuthProvider } from "../contexts/AuthContext";
import { CartProvider } from "../contexts/CartContext";
import { prewarmService } from "../services/prewarmService";

export default function RootLayout() {
  // Precalentamiento del backend (Render puede tardar en despertar)
  useEffect(() => {
    // Iniciar pre-calentamiento en background
    prewarmService.startWarmup();
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
      <Drawer>
        {/* Ocultar la ruta index del menú */}
        <Drawer.Screen name="index" options={{ drawerItemStyle: { display: 'none' } }} />
        {/* Ocultar ruta legacy home/home para evitar botón Home/Home duplicado */}
        <Drawer.Screen name="home/home" options={{ drawerItemStyle: { display: 'none' } }} />

        <Drawer.Screen name="home/inicio" options={{ title: "Inicio" }} />
        <Drawer.Screen name="catalogo/visual" options={{ title: "Catálogo Visual" }} />
        <Drawer.Screen name="catalogo/explore" options={{ title: "Explorar" }} />
        <Drawer.Screen name="contacto/contacto" options={{ title: "Contacto" }} />
        <Drawer.Screen name="auth/registro" options={{ title: "Registro" }} />
        <Drawer.Screen name="auth/login" options={{ title: "Login" }} />
        <Drawer.Screen name="carrito" options={{ title: "Carrito" }} />
      </Drawer>
      </CartProvider>
    </AuthProvider>
  )
}
