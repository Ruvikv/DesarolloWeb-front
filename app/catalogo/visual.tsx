import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Dimensions, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { productService, Product } from '../../services/catalogoService';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48) / 2; // similar al catálogo
const HERO_H = 180;

export default function VisualCatalog() {
  const router = useRouter();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await productService.getVisualCatalog();
      setItems(data);
    } catch (e) {
      console.warn('Error cargando catálogo visual', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const renderHero = () => (
    <View style={styles.hero}>
      <Text style={styles.heroTitle}>Catálogo Visual</Text>
      <Text style={styles.heroSubtitle}>Explora productos en una grilla moderna</Text>
      {loading && (
        <View style={styles.heroLoading}>
          <ActivityIndicator color="#fff" size="small" />
          <Text style={styles.heroLoadingText}>Cargando...</Text>
        </View>
      )}
    </View>
  );

  const handleProductPress = (productId: string) => {
    router.push({
      pathname: '/catalogo/[id]',
      params: { id: productId }
    });
  };

  const renderItem = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      style={[styles.card, { width: CARD_W }]}
      onPress={() => handleProductPress(item.id)}
    > 
      <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.cardCategory}>{item.category}</Text>
        <Text style={styles.cardPrice}>
          {item.price !== undefined ? `$${item.price.toFixed(2)}` : 'Sin precio'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        numColumns={2}
        ListHeaderComponent={renderHero}
        contentContainerStyle={styles.content}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={!loading ? (
          <Text style={styles.emptyText}>No hay elementos para mostrar</Text>
        ) : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  hero: {
    height: HERO_H,
    backgroundColor: '#7b1fa2',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    padding: 24,
    marginBottom: 16,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: '#E1BEE7',
    marginTop: 6,
  },
  heroLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  heroLoadingText: {
    color: '#fff',
    marginLeft: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardImage: {
    width: '100%',
    height: 130,
  },
  cardBody: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  cardCategory: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 8,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7b1fa2',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6c757d',
    marginTop: 20,
  },
});