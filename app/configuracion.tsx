import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ProtectedRoute from '../components/ProtectedRoute';

export default function ConfiguracionScreen() {
  return (
    <ProtectedRoute>
      <View style={styles.container}>
        <Text style={styles.title}>Configuración</Text>
        <Text style={styles.subtitle}>Preferencias del sistema (pantalla base).</Text>
        <Text style={styles.helper}>Aquí podremos añadir opciones más adelante.</Text>
      </View>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  helper: {
    marginTop: 12,
    color: '#999',
  }
});