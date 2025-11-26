import React, { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

export default function NotificationNavigator() {
  const router = useRouter();

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      try {
        const data: any = response?.notification?.request?.content?.data || {};
        const route = typeof data?.route === 'string' ? data.route : null;
        if (route) {
          router.push(route);
        }
      } catch (e) {
        console.warn('[NotificationNavigator] handle response error:', e);
      }
    });
    return () => {
      try { sub.remove(); } catch {}
    };
  }, [router]);

  return null;
}

