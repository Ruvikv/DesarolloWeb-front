import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { productService, Product } from '../../services/catalogoService';

// eliminado fallbackImage inexistente

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getPublicProducts();
      setProducts(data);
      setError(null);
    } catch (e: any) {
      setError('No pudimos cargar el catálogo público. Intenta más tarde.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [])
  );

  const renderItem = ({ item }: { item: Product }) => (
    <View style={styles.card}>
      {item.image ? (
        <Image
          source={{ uri: item.image }}
          style={styles.image}
          resizeMode="cover"
          onError={() => {}}
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderText}>Sin imagen</Text>
        </View>
      )}
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.price}>${item.price?.toFixed?.(2) ?? item.price}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}> 
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.helper}>Cargando productos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}> 
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadProducts}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Catálogo</Text>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ padding: 16, gap: 12 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', paddingHorizontal: 16, paddingTop: 12 },
  card: { flex: 1, backgroundColor: '#f8f9fb', borderRadius: 12, overflow: 'hidden', paddingBottom: 12 },
  image: { width: '100%', height: 130, backgroundColor: '#e9edf3' },
  imagePlaceholder: { width: '100%', height: 130, backgroundColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: '#757575', fontSize: 12 },
  name: { fontSize: 14, fontWeight: '600', paddingHorizontal: 10, paddingTop: 8 },
  price: { fontSize: 14, fontWeight: '500', paddingHorizontal: 10, color: '#2e7d32', marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { color: '#b00020', textAlign: 'center', marginBottom: 12 },
  retryBtn: { backgroundColor: '#007AFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
  helper: { marginTop: 8, color: '#546e7a' }
});
