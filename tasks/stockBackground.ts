import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { API_CONFIG } from '../config/api.js';
import { resumenEconomicoService } from '../services/resumenEconomicoService';
import { safeAsyncStorage } from '../services/storageUtils';

const STOCK_DAILY_TASK = 'STOCK_DAILY_TASK';
const LAST_SENT_KEY = 'lastStockDynamicSentISO';

function isToday(dateISO: string | null | undefined): boolean {
  if (!dateISO) return false;
  const d = new Date(dateISO);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function inDailyWindow(now = new Date()): boolean {
  // Ventana alrededor de las 09:00 (±30 minutos)
  const hours = now.getHours();
  const minutes = now.getMinutes();
  return hours === 9 && minutes <= 30; // 09:00 a 09:30
}

TaskManager.defineTask(STOCK_DAILY_TASK, async () => {
  try {
    if (Platform.OS === 'web') {
      // No hay background fetch confiable en web
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Requiere sesión
    const token = await safeAsyncStorage.getItem('authToken');
    if (!token) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const lastSent = await safeAsyncStorage.getItem(LAST_SENT_KEY);
    const now = new Date();

    // Enviar solo si estamos en la ventana y aún no se envió hoy
    if (!inDailyWindow(now) || isToday(lastSent)) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Confirmar que el usuario es administrador
    const isAdmin = await checkIsAdmin(token);
    if (!isAdmin) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const stats = await resumenEconomicoService.obtenerEstadisticasDashboard();
    const count = Number(stats?.alertas_stock || 0);

    // Programar o emitir inmediatamente con el conteo real
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Stock crítico',
        body: `Tienes ${count} producto${count === 1 ? '' : 's'} con stock bajo`,
        data: { tag: 'daily-stock-dynamic', route: '/estadisticas' },
        sound: true,
      },
      trigger: null,
    });

    await safeAsyncStorage.setItem(LAST_SENT_KEY, now.toISOString());
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (e) {
    console.warn('[background] STOCK_DAILY_TASK error:', e);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerStockBackgroundTask(): Promise<void> {
  try {
    if (Platform.OS === 'web') return;

    const status = await BackgroundFetch.getStatusAsync();
    if (status === BackgroundFetch.BackgroundFetchStatus.Restricted || status === BackgroundFetch.BackgroundFetchStatus.Denied) {
      console.warn('[background] Background Fetch no disponible o denegado');
      return;
    }

    const isRegistered = await TaskManager.isTaskRegisteredAsync(STOCK_DAILY_TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(STOCK_DAILY_TASK, {
        minimumInterval: 60 * 60, // cada hora
      });
      console.log('[background] STOCK_DAILY_TASK registrada');
    }
  } catch (e) {
    console.warn('[background] Error registrando STOCK_DAILY_TASK:', e);
  }
}

async function checkIsAdmin(token: string): Promise<boolean> {
  try {
    const resp = await fetch(`${API_CONFIG.BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!resp.ok) return false;
    const data = await resp.json();
    const role = (data?.rol ?? data?.role ?? '').toString().toUpperCase();
    return role.includes('ADMIN');
  } catch {
    return false;
  }
}
