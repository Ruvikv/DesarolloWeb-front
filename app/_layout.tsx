import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import React, { useEffect } from "react";
import { TouchableOpacity } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { prewarmService } from "../services/prewarmService";

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
      {/* Ocultar la ruta register del menú */}
      <Drawer.Screen name="auth/registerAdmin" options={{ drawerItemStyle: { display: 'none'  } }}  />
      {/* Ocultar la ruta register del menú */}
      <Drawer.Screen name="auth/registerRevendedor" options={{ drawerItemStyle: { display: 'none'  } }}  />
      {/* Ocultar ruta legacy home/home para evitar botón Home/Home duplicado */}
      <Drawer.Screen name="home/home" options={{ drawerItemStyle: { display: 'none' } }} />


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
      <Drawer.Screen name="catalogo/[id]" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="contacto/contacto" options={{ title: "Contacto" }} />
      <Drawer.Screen name="auth/login" options={{ title: "Iniciar sesión" }} />
      {/* Ocultar pantallas de administración del Drawer público */}
      <Drawer.Screen name="compras" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="revendedores" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="estadisticas" options={{ drawerItemStyle: { display: 'none' } }} />
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
