import { apiService } from '@/services/apiService';
import { authService } from '@/services/authService';
import { safeAsyncStorage } from '@/services/storageUtils';
import { registerForPushNotificationsAsync } from '@/utils/pushNotifications';
import { Subscription } from 'expo-modules-core';
import * as Notifications from 'expo-notifications';
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useAuth } from './AuthContext';

// Tipo para notificaciones in-app
export interface InAppNotification {
  id: string;
  type: 'order' | 'stock' | 'reminder' | 'info';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  route?: string; // Ruta a la que navegar al tocar
  data?: any; // Datos adicionales
}

interface NotificationsContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  error: Error | null;
  requestPermission: () => Promise<boolean>;
  // Notificaciones in-app
  inAppNotifications: InAppNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<InAppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotification tiene que utilizarse con NotificationsProvider');
  }
  return context;
};

interface NotificationsProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'inAppNotifications';

export const NotificationProvider: React.FC<NotificationsProviderProps> = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [inAppNotifications, setInAppNotifications] = useState<InAppNotification[]>([]);

  const notificationListener = useRef<Subscription>();
  const { token, user } = useAuth();

  // Cargar notificaciones in-app desde AsyncStorage al iniciar
  useEffect(() => {
    loadNotifications();
  }, []);

  // Guardar notificaciones in-app en AsyncStorage cuando cambien
  useEffect(() => {
    saveNotifications();
  }, [inAppNotifications]);

  const loadNotifications = async () => {
    try {
      const stored = await safeAsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setInAppNotifications(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('[NotificationsProvider] error cargando notificaciones:', e);
    }
  };

  const saveNotifications = async () => {
    try {
      await safeAsyncStorage.setItem(STORAGE_KEY, JSON.stringify(inAppNotifications));
    } catch (e) {
      console.warn('[NotificationsProvider] error guardando notificaciones:', e);
    }
  };

  const addNotification = (notif: Omit<InAppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: InAppNotification = {
      ...notif,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      read: false,
    };
    setInAppNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setInAppNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setInAppNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setInAppNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setInAppNotifications([]);
  };

  const unreadCount = inAppNotifications.filter(n => !n.read).length;

  useEffect(() => {
    // Registrar listeners para recibir notificaciones y respuestas
    notificationListener.current = Notifications.addNotificationReceivedListener((notif) => {
      try {
        setNotification(notif);
        console.log('Notificación recibida:', notif);
      } catch (e) {
        console.warn('[NotificationsProvider] error manejando notificación:', e);
      }
    });

    // Listener para cuando el usuario toca una notificación
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Usuario tocó la notificación:', response);
      const data = response.notification.request.content.data;

      // Aquí puedes manejar navegación basada en los datos de la notificación
      // Ejemplo: si data.route existe, navegar a esa ruta
      if (data?.route) {
        console.log('Navegando a:', data.route);
        // La navegación se puede implementar usando useRouter si es necesario
      }
    });

    return () => {
      try {
        if (notificationListener.current) {
          Notifications.removeNotificationSubscription(notificationListener.current);
        }
        Notifications.removeNotificationSubscription(responseListener);
      } catch { }
    };
  }, []);

  useEffect(() => {
    // Registrar el token de push solo cuando hay sesión y el usuario es ADMIN
    (async () => {
      try {
        if (!token) {
          setExpoPushToken(null);
          await safeAsyncStorage.removeItem('expoPushToken');
          return;
        }
        if (Platform.OS === 'web') {
          // En web, no pedir permisos automáticamente: usar token almacenado si existe
          const stored = await safeAsyncStorage.getItem('expoPushToken');
          if (stored) {
            setExpoPushToken(stored);
          }
          return;
        }

        const tokenStr = await registerForPushNotificationsAsync();
        setExpoPushToken(tokenStr);
        await safeAsyncStorage.setItem('expoPushToken', tokenStr);
        let userId = user?.id;
        if (!userId) {
          try {
            const profile = await authService.getProfile();
            userId = (profile?.id || profile?.userId || profile?.uid || '').toString();
          } catch { }
        }
        if (userId) {
          try {
            await apiService.post<any>('/notificaciones/registrar-token', {
              user_id: userId,
              platform: Platform.OS,
              token_type: 'expo',
              token: tokenStr,
            });
          } catch (e) {
            console.warn('[NotificationsProvider] envío de token al backend falló:', e);
          }
        }
      } catch (err: any) {
        console.warn('[NotificationsProvider] error registrando push:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    })();
  }, [token]);

  const requestPermission = async (): Promise<boolean> => {
    try {
      const tokenStr = await registerForPushNotificationsAsync();
      setExpoPushToken(tokenStr);
      await safeAsyncStorage.setItem('expoPushToken', tokenStr);
      let userId = user?.id;
      if (!userId) {
        try {
          const profile = await authService.getProfile();
          userId = (profile?.id || profile?.userId || profile?.uid || '').toString();
        } catch { }
      }
      if (userId) {
        try {
          await apiService.post<any>('/notificaciones/registrar-token', {
            user_id: userId,
            platform: Platform.OS,
            token_type: 'expo',
            token: tokenStr,
          });
        } catch (e) {
          console.warn('[NotificationsProvider] envío de token al backend falló:', e);
        }
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    }
  };

  return (
    <NotificationsContext.Provider value={{
      expoPushToken,
      notification,
      error,
      requestPermission,
      inAppNotifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAll,
    }}>
      {children}
    </NotificationsContext.Provider>
  );
};
