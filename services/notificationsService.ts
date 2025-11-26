import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

type AnyData = Record<string, any> | undefined;

export async function configureNotifications(): Promise<boolean> {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'General',
        importance: Notifications.AndroidImportance.DEFAULT,
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
    if (Platform.OS === 'web') {
      // En web las notificaciones locales no están soportadas de forma estándar.
      return;
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Operación exitosa',
        body: message || 'Se registró correctamente.',
        data: { tag: 'action-success' },
      },
      trigger: null,
    });
  } catch (e) {
    console.warn('[notifications] success notify error:', e);
  }
}
