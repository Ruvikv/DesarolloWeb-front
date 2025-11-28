import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Dimensions, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationsContext';
import { useThemeColors } from '../contexts/SettingsContext';
import { sendPushNotification } from '../services/notificationsService';
import { screenUtils, useResponsive } from '../utils/responsiveUtils';

const { width } = Dimensions.get('window');
const CARD_SIZE = width / 2 - 32;

interface CardProps {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  gradient: readonly [string, string, ...string[]];
  actionLabel: string;
}

const Card: React.FC<CardProps> = ({ title, subtitle, icon, onPress, gradient, actionLabel }) => {
  const { isMobile, isTablet } = useResponsive();
  const iconSize = isMobile ? 24 : 32;
  const titleSize = isMobile ? 16 : 18;
  const subtitleSize = isMobile ? 10 : 12;
  const actionButtonSize = isMobile ? 12 : 14;
  const cardHeight = isMobile ? 140 : isTablet ? 160 : 180;

  return (
    <TouchableOpacity
      style={[styles.cardContainer, {
        width: isMobile ? '100%' : isTablet ? '48%' : CARD_SIZE,
        marginBottom: isMobile ? 16 : 24
      }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient colors={gradient} style={[styles.cardGradient, { height: cardHeight }]}>
        <Ionicons name={icon} size={iconSize} color="#fff" style={styles.cardIcon} />
        <Text style={[styles.cardTitle, { fontSize: titleSize }]}>{title}</Text>
        <Text style={[styles.cardSubtitle, { fontSize: subtitleSize }]}>{subtitle}</Text>
        <View style={styles.actionButton}>
          <Text style={[styles.actionButtonText, { fontSize: actionButtonSize }]}>{actionLabel}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const Dashboard = () => {
  const { user, token, isLoading, logout } = useAuth();
  const router = useRouter();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const firstName = user?.name?.split(' ')[0] ?? 'Usuario';
  const themeColors = useThemeColors();
  const [isSendingPush, setIsSendingPush] = useState(false);
  const [pushFeedback, setPushFeedback] = useState<string | null>(null);
  const { expoPushToken, requestPermission, addNotification } = useNotification();
  const [permFeedback, setPermFeedback] = useState<string | null>(null);

  // Recordatorio diario al abrir el dashboard
  React.useEffect(() => {
    const lastReminderDate = localStorage.getItem('lastDailyReminder');
    const today = new Date().toDateString();

    if (lastReminderDate !== today) {
      // Solo mostrar una vez por día
      addNotification({
        type: 'reminder',
        title: '📊 Recordatorio Diario',
        message: 'No olvides revisar las ventas y el stock de hoy',
        route: '/estadisticas',
      });
      localStorage.setItem('lastDailyReminder', today);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleEnableNotifications = async () => {
    setPermFeedback(null);
    const ok = await requestPermission();
    setPermFeedback(ok ? 'Permiso concedido' : 'Permiso denegado o no disponible');
  };

  // La protección de ruta se maneja declarativamente en ProtectedRoute

  const handleSendTestPush = async () => {
    if (!user?.id) return;
    setIsSendingPush(true);
    setPushFeedback(null);
    try {
      const res = await sendPushNotification({
        user_id: user.id,
        title: 'Prueba de notificaciones',
        body: 'Hola desde el backend',
        data: { route: '/dashboard' },
      });
      setPushFeedback(`Enviada (sent: ${res?.sent ?? 0})`);
    } catch (e: any) {
      const msg = e?.message || 'Error al enviar notificación';
      setPushFeedback(msg);
    } finally {
      setIsSendingPush(false);
    }
  };

  const cards: CardProps[] = [
    {
      title: 'Productos',
      subtitle: 'Gestiona tu inventario',
      icon: 'cube-outline',
      gradient: ['#42e695', '#3bb2b8'] as const,
      actionLabel: 'Gestionar',
      onPress: () => router.push('/productos')
    },
    {
      title: 'Lista de Precios',
      subtitle: 'Actualiza precios',
      icon: 'pricetag-outline',
      gradient: ['#7f7fd5', '#86a8e7'] as const,
      actionLabel: 'Ver lista',
      onPress: () => router.push('/precios/lista')
    },
    {
      title: 'Catálogo Visual',
      subtitle: 'Imágenes y detalles',
      icon: 'images-outline',
      gradient: ['#ff6a00', '#ee0979'] as const,
      actionLabel: 'Ver',
      onPress: () => router.push('/catalogo/visual')
    },
    {
      title: 'Pedidos',
      subtitle: 'Órdenes de clientes',
      icon: 'clipboard-outline',
      gradient: ['#ff512f', '#dd2476'] as const,
      actionLabel: 'Gestionar',
      onPress: () => router.push('/pedidos/admin' as Href<'/pedidos/admin'>)
    },
    {
      title: 'Compras',
      subtitle: 'Registro de compras',
      icon: 'cart-outline',
      gradient: ['#f093fb', '#f5576c'] as const,
      actionLabel: 'Gestionar',
      onPress: () => router.push('/compras' as Href<'/compras'>),
    },
    {
      title: 'Estadísticas',
      subtitle: 'Resumen económico',
      icon: 'bar-chart-outline',
      gradient: ['#667eea', '#764ba2'] as const,
      actionLabel: 'Ver resumen',
      onPress: () => router.push('/estadisticas' as Href<'/estadisticas'>),
    },
    {
      title: 'Ventas',
      subtitle: 'Ventas manuales',
      icon: 'receipt-outline',
      gradient: ['#11998e', '#38ef7d'] as const,
      actionLabel: 'Registrar',
      onPress: () => router.push('/ventas'),
    },
    {
      title: 'Configuración',
      subtitle: 'Preferencias del sistema',
      icon: 'settings-outline',
      gradient: ['#636363', '#a2ab58'] as const,
      actionLabel: 'Configurar',
      onPress: () => router.push('/configuracion'),
    },
  ];

  return (
    <ProtectedRoute>
      <ScrollView style={{ backgroundColor: themeColors.background }} contentContainerStyle={[styles.container, { padding: screenUtils.getResponsivePadding() }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { marginBottom: isMobile ? 12 : 16 }]}>
          <View>
            <Text style={[styles.greeting, { fontSize: isMobile ? 20 : 24, color: themeColors.textPrimary }]}>Hola, {firstName} 👋</Text>
            <Text style={[styles.welcome, { fontSize: isMobile ? 14 : 16, color: themeColors.textSecondary }]}>Panel de Control</Text>
          </View>
          <TouchableOpacity style={[styles.logoutButton, { backgroundColor: themeColors.cardBackground }, isMobile && { paddingHorizontal: 8, paddingVertical: 6 }]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={isMobile ? 20 : 24} color={themeColors.textPrimary} />
            {!isMobile && <Text style={[styles.logoutText, { color: themeColors.textPrimary }]}>Cerrar Sesión</Text>}
          </TouchableOpacity>
        </View>
        {Platform.OS === 'web' && !!user?.id && !expoPushToken && (
          <View style={[styles.testPushRow, { borderColor: themeColors.accent }]}>
            <TouchableOpacity
              style={[styles.testPushButton, { backgroundColor: themeColors.cardBackground }]}
              onPress={handleEnableNotifications}
              activeOpacity={0.8}
            >
              <Ionicons name="notifications-outline" size={isMobile ? 18 : 20} color={themeColors.textPrimary} />
              <Text style={[styles.testPushText, { color: themeColors.textPrimary }]}>Permitir notificaciones</Text>
            </TouchableOpacity>
            {permFeedback && <Text style={[styles.testPushFeedback, { color: themeColors.textSecondary }]}>{permFeedback}</Text>}
          </View>
        )}
        {!!user?.id && (
          <View style={[styles.testPushRow, { borderColor: themeColors.accent }]}>
            <TouchableOpacity
              style={[styles.testPushButton, { backgroundColor: themeColors.cardBackground }]}
              onPress={handleSendTestPush}
              disabled={isSendingPush}
              activeOpacity={0.8}
            >
              <Ionicons name="notifications-outline" size={isMobile ? 18 : 20} color={themeColors.textPrimary} />
              <Text style={[styles.testPushText, { color: themeColors.textPrimary }]}>Enviar notificación de prueba</Text>
            </TouchableOpacity>
            {isSendingPush && <ActivityIndicator size="small" color={themeColors.accent} />}
            {pushFeedback && <Text style={[styles.testPushFeedback, { color: themeColors.textSecondary }]}>{pushFeedback}</Text>}
          </View>
        )}
        <View style={[styles.grid, isMobile && { flexDirection: 'column' }] as any}>
          {cards.map((card, index) => (
            <Card key={index} {...card} />
          ))}
        </View>
      </ScrollView>
    </ProtectedRoute>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  container: {
    // El padding ahora se maneja dinámicamente
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontWeight: '600',
    marginBottom: 4,
  },
  welcome: {
    color: '#666',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff4444',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutText: {
    color: '#ff4444',
    fontWeight: '600',
    marginLeft: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardContainer: {
    marginBottom: 24,
  },
  cardGradient: {
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
  },
  cardIcon: {
    alignSelf: 'flex-start',
  },
  cardTitle: {
    fontWeight: '700',
    color: '#fff',
  },
  cardSubtitle: {
    color: '#eee',
  },
  actionButton: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  testPushRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  testPushButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#999',
  },
  testPushText: {
    fontWeight: '600',
    marginLeft: 6,
  },
  testPushFeedback: {
    marginLeft: 8,
  },
});
