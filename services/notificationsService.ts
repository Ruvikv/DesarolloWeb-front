import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { apiService } from './apiService';

type AnyData = Record<string, any> | undefined;

export async function configureNotifications(): Promise<boolean> {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'General',
        // HIGH favorece sonido y vibración por defecto
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    const current = await Notifications.getPermissionsAsync();
    if (current.status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      return !!req.granted;
    }
    return true;
  } catch (e) {
    console.warn('[notifications] configure error:', e);
    return false;
  }
}

export async function ensureDefaultSchedules(): Promise<void> {
  // Las notificaciones programadas no están disponibles en web
  if (Platform.OS === 'web') {
    return;
  }

  try {
    // Evitar duplicados
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const hasWeekly = scheduled?.some((req) => ((req?.content?.data as AnyData)?.tag) === 'weekly-review');

    if (!hasWeekly) {
      // Semana: lunes 10:00. En plataformas que soportan CalendarTrigger con weekday.
      const calendarTrigger: Notifications.CalendarTriggerInput = {
        weekday: 2, // 1=domingo, 2=lunes (Expo CalendarTrigger)
        hour: 10,
        minute: 0,
        repeats: true,
      };
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Recordatorio semanal',
          body: 'Revisa las estadísticas de la semana.',
          data: { tag: 'weekly-review', route: '/estadisticas' },
          // iOS: reproduce sonido por defecto; Android usa el canal
          sound: true,
        },
        trigger: calendarTrigger,
      });
    }
  } catch (e) {
    console.warn('[notifications] ensure schedules error:', e);
  }
}

export async function notifyOperationSuccess(message?: string): Promise<void> {
  try {
    // En web las notificaciones locales funcionan si el navegador lo permite
    // if (Platform.OS === 'web') { ... }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Operación exitosa',
        body: message || 'Se registró correctamente.',
        data: { tag: 'action-success' },
        sound: true,
      },
      trigger: null,
    });
  } catch (e) {
    console.warn('[notifications] success notify error:', e);
  }
}

// ---------------- Push via backend ----------------
export interface PushSendRequest {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface PushSendResponse {
  sent: number;
  tickets?: any[];
  receipts?: any[];
}

export async function sendPushNotification(payload: PushSendRequest): Promise<PushSendResponse> {
  try {
    // Permitir que el interceptor agregue el token de autenticación (Bearer ...)
    const resp = await apiService.post<PushSendResponse>('/notificaciones/enviar', payload);
    return resp;
  } catch (error: any) {
    const status = error?.response?.status;
    if (status === 404) {
      const err = new Error('Endpoint de notificaciones no disponible (404). Verifica el backend.');
      (err as any).code = 'NOTIFICATIONS_ENDPOINT_NOT_FOUND';
      throw err;
    }
    console.error('[notifications] error enviando push:', error);
    throw error;
  }
}

// ---------------- Integración completa con backend ----------------

/**
 * Registra el dispositivo para recibir notificaciones push
 * @param userId - ID del usuario actual
 * @returns El token de push o null si falla
 */
export async function registerForPushNotifications(userId: string): Promise<string | null> {
  let token: string | undefined;

  // Permitir en emuladores y web para propósitos de demo/desarrollo
  if (!Device.isDevice && Platform.OS !== 'web') {
    console.warn('Estás en un emulador. Las notificaciones push remotas pueden no funcionar, pero las locales sí.');
  }

  try {
    // Solicitar permisos
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('No se otorgaron permisos para notificaciones');
      return null;
    }

    // Obtener el token de Expo Push
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;

    if (Platform.OS === 'web') {
      token = 'web-demo-token-' + Date.now();
    } else {
      try {
        if (projectId) {
          token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        } else {
          token = (await Notifications.getExpoPushTokenAsync()).data;
        }
      } catch (e) {
        console.warn('Error obteniendo token real (posiblemente emulador):', e);
        token = 'emulator-demo-token-' + Date.now();
      }
    }

    console.log('Token de notificación obtenido:', token);

    // Registrar el token en el backend
    const response = await apiService.post('/notificaciones/registrar-token', {
      user_id: userId,
      platform: Platform.OS as 'ios' | 'android',
      token_type: 'expo',
      token: token,
    });

    console.log('Token registrado en backend:', response);
    return token;
  } catch (error) {
    console.error('Error al registrar notificaciones:', error);
    return null;
  }
}

/**
 * Registra un token manualmente (útil para pruebas o cuando se tiene el token de otro dispositivo)
 */
export async function registerManualToken(userId: string, token: string): Promise<boolean> {
  try {
    const response = await apiService.post('/notificaciones/registrar-token', {
      user_id: userId,
      platform: Platform.OS as 'ios' | 'android',
      token_type: 'expo',
      token: token,
    });
    console.log('Token manual registrado:', response);
    return true;
  } catch (error) {
    console.error('Error al registrar token manual:', error);
    return false;
  }
}

/**
 * Configura los listeners para manejar notificaciones
 */
export function setupNotificationListeners(onNotificationTap?: (data: any) => void) {
  // Listener para cuando se recibe una notificación mientras la app está abierta
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notificación recibida:', notification);
    // Aquí puedes manejar la notificación como quieras
  });

  // Listener para cuando el usuario toca una notificación
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Usuario tocó la notificación:', response);
    const data = response.notification.request.content.data;

    // Llamar callback si existe
    if (onNotificationTap) {
      onNotificationTap(data);
    }
  });

  // Retornar función de limpieza
  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}

/**
 * Envía una notificación de prueba
 */
export async function sendTestNotification(userId: string) {
  try {
    let response;
    try {
      response = await apiService.post('/notificaciones/enviar', {
        user_id: userId,
        title: '🎉 Notificación de Prueba',
        body: 'Si ves esto, ¡las notificaciones están funcionando!',
        data: { test: true },
      });
      console.log('Notificación enviada:', response);
    } catch (error) {
      console.error('Error al enviar notificación al backend:', error);
      // Si no es web/emulador, relanzar el error porque es crítico
      if (Platform.OS !== 'web' && Device.isDevice) {
        throw error;
      }
    }

    // Para DEMO en Web/Emulador: Mostrar notificación local también para asegurar que se vea
    // Esto se ejecuta incluso si el backend falla (para poder mostrar la demo)
    if (Platform.OS === 'web' || !Device.isDevice) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎉 Notificación de Prueba (Local)',
          body: 'Si ves esto, ¡las notificaciones están funcionando! (Simulado)',
          data: { test: true },
        },
        trigger: null,
      });
      // Retornar respuesta fake si no hubo real
      if (!response) return { sent: 1, demo: true };
    }

    return response;
  } catch (error) {
    console.error('Error general en sendTestNotification:', error);
    throw error;
  }
}
