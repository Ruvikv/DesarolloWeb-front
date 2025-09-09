import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

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
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] ?? 'Usuario';

  const cards: CardProps[] = [
    { title: 'Productos', subtitle: 'Gestiona tu inventario', icon: 'cube-outline', gradient: ['#42e695', '#3bb2b8'] as const, actionLabel: 'Gestionar' },
    { title: 'Lista de Precios', subtitle: 'Actualiza precios', icon: 'pricetag-outline', gradient: ['#7f7fd5', '#86a8e7'] as const, actionLabel: 'Ver lista' },
    { title: 'Catálogo Visual', subtitle: 'Imágenes y detalles', icon: 'images-outline', gradient: ['#ff6a00', '#ee0979'] as const, actionLabel: 'Ver' },
    { title: 'Pedidos', subtitle: 'Órdenes de clientes', icon: 'clipboard-outline', gradient: ['#ff512f', '#dd2476'] as const, actionLabel: 'Gestionar' },
    { title: 'Ventas', subtitle: 'Ventas manuales', icon: 'receipt-outline', gradient: ['#11998e', '#38ef7d'] as const, actionLabel: 'Registrar' },
    { title: 'Configuración', subtitle: 'Preferencias del sistema', icon: 'settings-outline', gradient: ['#636363', '#a2ab58'] as const, actionLabel: 'Configurar' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.greeting}>Hola, {firstName} 👋</Text>
      <Text style={styles.welcome}>Panel de Administración</Text>
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
  greeting: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  welcome: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
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
});