import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

function resolveProjectId(): string | undefined {
  try {
    const extraId = (Constants?.expoConfig as any)?.extra?.eas?.projectId;
    if (typeof extraId === 'string' && extraId.length > 0) return extraId;
  } catch {}
  try {
    const manifestId = (Constants as any)?.manifest?.extra?.eas?.projectId;
    if (typeof manifestId === 'string' && manifestId.length > 0) return manifestId;
  } catch {}
  return undefined;
}

export async function registerForPushNotificationsAsync(): Promise<string> {
  // Si el módulo nativo de notificaciones no está disponible, dar mensaje claro
  const hasNotificationsNative = !!(Notifications && typeof Notifications.getExpoPushTokenAsync === 'function');
  if (!hasNotificationsNative) {
    throw new Error('Notificaciones nativas no disponibles. Instala el development build con "npx expo run:android" o usa Expo Go.');
  }

  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    } catch (e) {
      console.warn('[push] error configurando canal default:', e);
    }
  }

  // En RN/Hermes puede faltar expo-device: solo validar si está disponible
  const hasDeviceModule = typeof (Device as any)?.isDevice === 'boolean';
  if (hasDeviceModule && !Device.isDevice) {
    throw new Error('Necesitas un dispositivo físico para recibir alertas.');
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    throw new Error('No se concedieron permisos para notificaciones push.');
  }

  const projectId = resolveProjectId();
  try {
    let tokenData: string;
    if (projectId) {
      tokenData = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } else {
      // Fallback para entornos sin projectId (desarrollo / Expo Go)
      tokenData = (await Notifications.getExpoPushTokenAsync()).data;
    }
    console.log('Push notification token:', tokenData);
    return tokenData;
  } catch (e: any) {
    // Mensaje más claro si el módulo falta
    const msg = String(e?.message || e || '');
    if (/native module|not found|unavailable/i.test(msg)) {
      throw new Error('No se pudo obtener el token. Asegúrate de instalar el development build (npx expo run:android) o usar Expo Go.');
    }
    throw (e instanceof Error ? e : new Error(String(e)));
  }
}
