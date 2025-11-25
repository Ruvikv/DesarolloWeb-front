import { NotificationProvider } from "@/contexts/NotificationsContext";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from 'expo-notifications';
import { useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import React, { useEffect, useState } from "react";
import { Linking, Platform, Text, TouchableOpacity, View } from "react-native";
import 'react-native-gesture-handler';
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { CartProvider, useCart } from "../contexts/CartContext";
import { prewarmService } from "../services/prewarmService";

async function getPushToken() {
  try {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: "b9fc8a7e-e7ae-42a4-a403-ce3b95f2cae2"
    });
    console.log("Token push:", token.data);
    return token.data;
  } catch (e) {
    console.error("Error al obtener el token de notificación:", e);
  }
}

// async function registerForPushNotificationsAsync() {
//   let token;

//   if (Device.isDevice) {
//     const { status: existingStatus } = await Notifications.getPermissionsAsync();
//     let finalStatus = existingStatus;

//     if (existingStatus !== 'granted') {
//       const { status } = await Notifications.requestPermissionsAsync();
//       finalStatus = status;
//     }

//     if (finalStatus !== 'granted') {
//       alert('No se concedieron permisos para notificaciones push.');
//       return
//     }

//     token = (await Notifications.getExpoPushTokenAsync()).data;
//     console.log("Token de notificación:", token);
//   } else {
//     alert ('Necesitas un dispositivo físico para recibir alertas.')
//   }

//   if (Platform.OS === 'android') {
//     await Notifications.setNotificationChannelAsync('default', {
//       name: 'default',
//       importance: Notifications.AndroidImportance.MAX,
//       vibrationPattern: [0, 250, 250, 250],
//       lightColor: '#FF231F7C',
//     });
//   }
//   console.log("entró a register")

//   return token;
// }
async function registerForPushNotificationsAsync() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log(token);
  return token;
}

async function requestPermissionAsync() {
  const { status } = await Notifications.requestPermissionsAsync();
  console.log("Permisos de notificación:", status);
  if (status !== 'granted') {
    alert("No se otorgaron permisos de notificación");
  }
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: false,
    shouldShowList: true
  }),
});
async function testNotification() {
  console.log("Llamada la función");
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Hola!',
        body: 'Esta es una notificación de prueba. ⌚',
      },
      trigger: { seconds: 20 },
    });
    console.log("Id de la notifiación", id)
  } catch (e) {
    console.error("eror", e)
  }
}
async function scheduleAndCancel() {
  const identifier= await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Hey!',
    },
    trigger: { seconds: 60, repeats: false},
  });
  //await Notifications.cancelScheduledNotificationAsync(identifier);
}

function BackButton() {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.back()}>
      {/* <Ionicons name="arrow-back" size={24} color="#000" /> */}
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
        <TouchableOpacity onPress={testNotification}>
          <Ionicons name="notifications-outline" size={24} color="#000" />
        </TouchableOpacity>
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
      <Drawer.Screen name="catalogo/visual-admin" options={{ title: "CVAdmin" }} />
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
  useEffect(() => {
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }
}, []);

  // Precalentamiento del backend (Render puede tardar en despertar)
  useEffect(() => {
    prewarmService.startWarmup();
  }, []);

  useEffect(() => {
    requestPermissionAsync();
  }, [])

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      console.log('token', token)
    })
  })

  useEffect(() => {
    getPushToken()
  }, [])

  useEffect(() => {
  const subscription = Notifications.addNotificationResponseReceivedListener(response => {
    const url = response.notification.request.content.data;
    if (url) Linking.openURL(url);
  });
  return () => subscription.remove();
}, []);

  const [token, setToken] = useState("");
  useEffect(() => {
    Notifications.getExpoPushTokenAsync().then((t) => {
      setToken(t.data);
  });
}, []);


  return (
    <NotificationProvider>
      <AuthProvider>
        <CartProvider>
                  <View style={{ padding: 20 }}>
            <TouchableOpacity
              onPress={testNotification}
              style={{
                backgroundColor: "#7b1fa2",
                padding: 12,
                borderRadius: 8,
                marginBottom: 10,
              }}
            >
              <Text style={{ color: "#fff", textAlign: "center", fontWeight: "bold" }}>
                Probar notificación - Token {token}
              </Text>
            </TouchableOpacity>
          </View>
          <DrawerLayout />
        </CartProvider>
      </AuthProvider>
    </NotificationProvider>
  );
}
