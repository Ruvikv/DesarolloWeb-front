# 📱 Notificaciones Push - Guía Rápida

## 🚀 Inicio Rápido

### 1. Probar en Desarrollo

```bash
# Ejecutar en dispositivo físico (NO funciona en emulador)
npm run android
# o
npm run ios
```

### 2. Navegar a Configuración

Desde cualquier componente:
```typescript
import { useRouter } from 'expo-router';

const router = useRouter();
router.push('/notificaciones');
```

### 3. Activar y Probar

1. Presiona **"Activar Notificaciones"**
2. Presiona **"Enviar Notificación de Prueba"**
3. ¡Deberías recibir una notificación! 🎉

---

## 📋 Archivos Modificados

- ✅ `app.json` - Configuración de notificaciones
- ✅ `services/notificationsService.ts` - Funciones de push
- ✅ `contexts/NotificationsContext.tsx` - Manejo de respuestas
- ✅ `app/notificaciones.tsx` - Pantalla de prueba (NUEVO)
- ✅ `app/_layout.tsx` - Ruta agregada

---

## 🔧 Funciones Disponibles

### `registerForPushNotifications(userId: string)`
Registra el dispositivo para recibir notificaciones.

### `sendTestNotification(userId: string)`
Envía una notificación de prueba.

### `setupNotificationListeners(callback?)`
Configura listeners para notificaciones.

---

## 💡 Uso en Backend

```typescript
// Enviar notificación desde el backend
await this.notificacionesService.enviar({
  user_id: 'user-123',
  title: '🎉 Nueva Venta',
  body: 'Venta de $500 registrada',
  data: { ventaId: '123', route: '/ventas' }
# 📱 Notificaciones Push - Guía Rápida

## 🚀 Inicio Rápido

### 1. Probar en Desarrollo

```bash
# Ejecutar en dispositivo físico (NO funciona en emulador)
npm run android
# o
npm run ios
```

### 2. Navegar a Configuración

Desde cualquier componente:
```typescript
import { useRouter } from 'expo-router';

const router = useRouter();
router.push('/notificaciones');
```

### 3. Activar y Probar

1. Presiona **"Activar Notificaciones"**
2. Presiona **"Enviar Notificación de Prueba"**
3. ¡Deberías recibir una notificación! 🎉

---

## 📋 Archivos Modificados

- ✅ `app.json` - Configuración de notificaciones
- ✅ `services/notificationsService.ts` - Funciones de push
- ✅ `contexts/NotificationsContext.tsx` - Manejo de respuestas
- ✅ `app/notificaciones.tsx` - Pantalla de prueba (NUEVO)
- ✅ `app/_layout.tsx` - Ruta agregada

---

## 🔧 Funciones Disponibles

### `registerForPushNotifications(userId: string)`
Registra el dispositivo para recibir notificaciones.

### `sendTestNotification(userId: string)`
Envía una notificación de prueba.

### `setupNotificationListeners(callback?)`
Configura listeners para notificaciones.

---

## 💡 Uso en Backend

```typescript
// Enviar notificación desde el backend
await this.notificacionesService.enviar({
  user_id: 'user-123',
  title: '🎉 Nueva Venta',
  body: 'Venta de $500 registrada',
  data: { ventaId: '123', route: '/ventas' }
});
```

---

## ⚠️ Importante
 
 - ⚠️ **Emuladores/Web**: Funcionan en **Modo Demo** (simulación local)
 - ✅ **Dispositivos Físicos**: Funcionan con Push Notifications reales
 - ✅ **Android**: Necesitas `google-services.json` para producción
 - ✅ **iOS**: Necesitas configurar APNs para producción
 
 ---
 
 ## 🆘 Problemas Comunes
 
 ### No llegan notificaciones reales
 - Verifica que estés en un dispositivo físico
 - Revisa que los permisos estén concedidos
 - Confirma que el token se guardó en la BD
 
 ### Modo Demo
 - En Web y Emuladores, verás un aviso de "Modo Demo".
 - Las notificaciones se generan localmente para pruebas de UI.
 - El token generado será ficticio (ej: `web-demo-token...`).
 
 ### Error "No project ID"
 Ejecuta:
 ```bash
 npx expo login
 npx eas init
 ```
 
 ---
 
 ## 📚 Documentación Completa
 
 Ver [walkthrough.md](file:///c:/Users/Natalia/.gemini/antigravity/brain/1b798f4e-8474-4289-9281-691a489e838a/walkthrough.md) para documentación detallada.
 
 ---
 
 **¡Todo listo para usar!** 🚀
