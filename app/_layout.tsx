import { Drawer } from "expo-router/drawer";

export default function RootLayout() {
  return (
    <Drawer>
      <Drawer.Screen name="tabs/home" options={{ title: "Home" }} />
      <Drawer.Screen name="tabs/explore" options={{ title: "Explorar" }} />
      <Drawer.Screen name="tabs/login" options={{ title: "Login" }} />
    </Drawer>
  )
}
