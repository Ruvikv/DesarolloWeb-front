import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, RefreshControl, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCart } from '../../contexts/CartContext';
import { Product, productService } from '../../services/catalogoService';
import { useResponsive } from '../../utils/responsiveUtils';

export default function VisualCatalog() {
  const router = useRouter();
  const { addItem } = useCart();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { isMobile, isTablet, deviceCategory } = useResponsive();

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

  const renderHero = () => {
    const heroHeight = isMobile ? 140 : isTablet ? 160 : 180;
    const titleSize = isMobile ? 24 : isTablet ? 26 : 28;
    const subtitleSize = isMobile ? 14 : 16;

    return (
      <View style={[styles.hero, { height: heroHeight }]}>
        <Text style={[styles.heroTitle, { fontSize: titleSize }]}>Catálogo Visual</Text>
        <Text style={[styles.heroSubtitle, { fontSize: subtitleSize }]}>Explora productos en una grilla moderna</Text>
        {loading && (
          <View style={styles.heroLoading}>
            <ActivityIndicator color="#fff" size={isMobile ? "small" : "large"} />
            <Text style={styles.heroLoadingText}>Cargando...</Text>
          </View>
        )}
      </View>
    );
  };

  const handleProductPress = (productId: string) => {
    router.push({
      pathname: '/catalogo/[id]',
      params: { id: productId }
    });
  };

  const handleAddToCart = (product: Product) => {
    addItem(product, 1);
    Alert.alert(
      '¡Producto añadido!',
      `${product.name} se ha añadido a tu carrito correctamente`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  const renderItem = ({ item }: { item: Product }) => {
    const cardTitleSize = isMobile ? 14 : isTablet ? 15 : 16;
    const cardCategorySize = isMobile ? 11 : 12;
    const cardPriceSize = isMobile ? 14 : isTablet ? 15 : 16;
    const buttonTextSize = isMobile ? 12 : 14;
    const imageHeight = isMobile ? 110 : isTablet ? 120 : 130;

    return (
      <View style={[styles.card, { margin: 8, flex: 1, maxWidth: isMobile ? '48%' : isTablet ? '48%' : '32%' }]}>
        <TouchableOpacity onPress={() => handleProductPress(item.id)}>
          <Image source={{ uri: item.image }} style={[styles.cardImage, { height: imageHeight }]} />
        </TouchableOpacity>
        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, { fontSize: cardTitleSize }]} numberOfLines={2}>{item.name}</Text>
          <Text style={[styles.cardCategory, { fontSize: cardCategorySize }]}>{item.category}</Text>
          <Text style={[styles.cardPrice, { fontSize: cardPriceSize }]}>${item.price?.toFixed?.(2) ?? item.price ?? ''}</Text>
          <TouchableOpacity style={[styles.addBtn, { paddingVertical: isMobile ? 6 : 8 }]} onPress={() => handleAddToCart(item)}>
            <Text style={[styles.addBtnText, { fontSize: buttonTextSize }]}>Añadir al carrito</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Calcular número de columnas responsivas
  const numColumns = isMobile ? 2 : isTablet ? 2 : 3;
  const spacing = isMobile ? 8 : 16;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        key={numColumns} // Force re-render when columns change
        data={items}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        numColumns={numColumns}
        ListHeaderComponent={renderHero}
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: spacing }
        ]}
        columnWrapperStyle={numColumns > 1 ? [
          styles.row,
          { marginHorizontal: -spacing / 2 }
        ] : undefined} // Only pass columnWrapperStyle if numColumns > 1
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={!loading ? (
          <Text style={[styles.emptyText, { fontSize: isMobile ? 14 : 16 }]}>
            No hay elementos para mostrar
          </Text>
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
    paddingBottom: 16,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  hero: {
    backgroundColor: '#7b1fa2',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    padding: 24,
    marginBottom: 16,
    justifyContent: 'center',
  },
  heroTitle: {
    color: '#fff',
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
  },
  cardBody: {
    padding: 12,
  },
  cardTitle: {
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  cardCategory: {
    color: '#6c757d',
    marginBottom: 8,
  },
  cardPrice: {
    fontWeight: '700',
    color: '#7b1fa2',
  },
  addBtn: {
    marginTop: 8,
    backgroundColor: '#7b1fa2',
    borderRadius: 8,
    alignItems: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6c757d',
    marginTop: 20,
  },
});