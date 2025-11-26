import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useThemeColors } from '../contexts/SettingsContext';
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

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Protección de ruta: redirigir al login si no hay token
  useEffect(() => {
    if (!isLoading && !token) {
      router.replace('/auth/login');
    }
  }, [token, isLoading, router]);

  // Mostrar loading solo si se está verificando y aún no hay token
  if (isLoading && !token) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }] }>
        <ActivityIndicator size="large" color={themeColors.accent} />
        <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>Verificando autenticación...</Text>
      </View>
    );
  }

  // Si no hay token, no renderizar nada (se redirigirá)
  if (!token) {
    return null;
  }

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
      <View style={[styles.grid, isMobile && { flexDirection: 'column' }] as any}>
        {cards.map((card, index) => (
          <Card key={index} {...card} />
        ))}
      </View>
    </ScrollView>
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
});
