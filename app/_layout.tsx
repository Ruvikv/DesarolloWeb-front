import React, { useEffect } from "react";
import { Drawer } from "expo-router/drawer";
import { Link } from "expo-router";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { prewarmService } from "../services/prewarmService";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

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
      {/* Ocultar ruta legacy home/home para evitar botón Home/Home duplicado */}
      <Drawer.Screen name="home/home" options={{ drawerItemStyle: { display: 'none' } }} />

      <Drawer.Screen name="home/inicio" options={{ title: "Inicio" }} />
      {/* Solo mostrar Dashboard si el usuario está autenticado */}
      <Drawer.Screen 
        name="dashboard" 
        options={{ 
          title: "Dashboard",
          drawerItemStyle: user ? {} : { display: 'none' }
        }} 
      />
      <Drawer.Screen name="catalogo/visual" options={{ title: "Catálogo Visual" }} />
      <Drawer.Screen name="catalogo/explore" options={{ title: "Explorar" }} />
      <Drawer.Screen name="catalogo/[id]" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="contacto/contacto" options={{ title: "Contacto" }} />
      <Drawer.Screen name="auth/registro" options={{ title: "Registro" }} />
      <Drawer.Screen name="auth/login" options={{ title: "Login" }} />
    </Drawer>
  );
}

export default function RootLayout() {
  // Precalentamiento del backend (Render puede tardar en despertar)
  useEffect(() => {
    // Iniciar pre-calentamiento en background
    prewarmService.startWarmup();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <DrawerLayout />
      </AuthProvider>
    </GestureHandlerRootView>
  )
}
