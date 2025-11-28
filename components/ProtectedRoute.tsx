import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, token, isLoading } = useAuth();
  // Redirigir usando componente declarativo para evitar navegar antes de montar el Layout
  if (!isLoading && !token) {
    return <Redirect href="/auth/login" />;
  }

  // Mostrar loading solo si se está verificando y aún no hay usuario
  if (isLoading && !token) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Verificando autenticación...</Text>
      </View>
    );
  }

  // Si no hay token, no renderizar nada (se redirigirá)
  if (!token) {
    return null;
  }

  // Si hay usuario autenticado, renderizar el contenido
  return <>{children}</>;
};

const styles = StyleSheet.create({
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

export default ProtectedRoute;
