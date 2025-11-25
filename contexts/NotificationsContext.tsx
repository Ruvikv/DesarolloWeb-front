import { registerForPushNotificationsAsync } from '@/utils/registerForPushNotificationsAsync';
import { Subscription } from 'expo-modules-core';
import * as Notifications from 'expo-notifications';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react';

interface NotificationsContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  error: Error | null;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationsContext);
  if (context == undefined) {
    throw new Error('useNotification tiene que utilizarse con NotificationsProvider');
  }
  return context;
};

interface NotificationsProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationsProviderProps> = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const notificationListener = useRef<Subscription>();
  const responseListener = useRef<Subscription>();

  useEffect(() => {
    registerForPushNotificationsAsync().then(
      (token) => setExpoPushToken(token),
      (error) => setError(error)
    );

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notificación recibida:', notification);
      setNotification(notification);
    });

    responseListener.current = 
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(
          'Respuesta a la notificación:',
          JSON.stringify(response, null, 2),
          JSON.stringify(response.notification.request.content.data, null, 2)
        );
      });

      return () => {
        if (notificationListener.current) {
          Notifications.removeNotificationSubscription(
            notificationListener.current
          );
        }
        if (responseListener.current) {
          Notifications.removeNotificationSubscription(
            responseListener.current
          );
      }
      };
  }, []);

  return (
    <NotificationsContext.Provider value={{ expoPushToken, notification, error }}>
      {children}
    </NotificationsContext.Provider>
  );
};