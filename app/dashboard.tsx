import React, { useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';

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

const Card: React.FC<CardProps> = ({ title, subtitle, icon, onPress, gradient, actionLabel }) => (
  <TouchableOpacity style={styles.cardContainer} onPress={onPress} activeOpacity={0.8}>
    <LinearGradient colors={gradient} style={styles.cardGradient}>
      <Ionicons name={icon} size={32} color="#fff" style={styles.cardIcon} />
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
      <View style={styles.actionButton}>
        <Text style={styles.actionButtonText}>{actionLabel}</Text>
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

const Dashboard = () => {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const firstName = user?.name?.split(' ')[0] ?? 'Usuario';

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Protección de ruta: redirigir al login si no hay usuario autenticado
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/auth/login');
    }
  }, [user, isLoading, router]);

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Verificando autenticación...</Text>
      </View>
    );
  }

  // Si no hay usuario, no renderizar nada (se redirigirá)
  if (!user) {
    return null;
  }

  const cards: CardProps[] = [
    { title: 'Productos', subtitle: 'Gestiona tu inventario', icon: 'cube-outline', onPress: () => router.push('/productos'), gradient: ['#42e695', '#3bb2b8'] as const, actionLabel: 'Gestionar' },
    { title: 'Lista de Precios', subtitle: 'Actualiza precios', icon: 'pricetag-outline', onPress: () => router.push('/precios/lista'), gradient: ['#7f7fd5', '#86a8e7'] as const, actionLabel: 'Ver lista' },
    { title: 'Catálogo Visual', subtitle: 'Imágenes y detalles', icon: 'images-outline', onPress: () => router.push('/catalogo/visual-admin'), gradient: ['#ff6a00', '#ee0979'] as const, actionLabel: 'Gestionar' },
    { title: 'Pedidos', subtitle: 'Órdenes de clientes', icon: 'clipboard-outline', gradient: ['#ff512f', '#dd2476'] as const, actionLabel: 'Gestionar' },
    { title: 'Ventas', subtitle: 'Ventas manuales', icon: 'receipt-outline', gradient: ['#11998e', '#38ef7d'] as const, actionLabel: 'Registrar' },
    { title: 'Configuración', subtitle: 'Preferencias del sistema', icon: 'settings-outline', gradient: ['#636363', '#a2ab58'] as const, actionLabel: 'Configurar' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {firstName} 👋</Text>
          <Text style={styles.welcome}>Panel de Administración</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#ff4444" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.grid}>
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
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  welcome: {
    fontSize: 16,
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
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardContainer: {
    width: CARD_SIZE,
    marginBottom: 24,
  },
  cardGradient: {
    borderRadius: 16,
    padding: 16,
    height: 180,
    justifyContent: 'space-between',
  },
  cardIcon: {
    alignSelf: 'flex-start',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  cardSubtitle: {
    fontSize: 12,
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
    fontSize: 16,
    color: '#666',
  },
});