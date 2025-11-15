import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from "react-native";
import styled from "styled-components/native";
import { Product, productService } from "../../services/catalogoService";
import { Categoria, categoriasService } from "../../services/categoriasService";

// Styled Components
const Container = styled.ScrollView`
  flex: 1;
  background-color: #f5f5f5;
`;

const Header = styled.View`
  background-color: #667eea;
  padding: 80px 20px 50px 20px;
  align-items: center;
  position: relative;
  overflow: hidden;
  min-height: 200px;
`;

const WelcomeContainer = styled.View`
  align-items: center;
  margin-bottom: 30px;
`;

const GreetingText = styled.Text`
  font-size: 32px;
  font-weight: bold;
  color: white;
  text-align: center;
  margin-bottom: 8px;
  text-shadow: 0px 2px 4px rgba(0,0,0,0.3);
`;

const WelcomeMessage = styled.Text`
  font-size: 18px;
  color: #f0f4ff;
  text-align: center;
  opacity: 0.9;
`;

const BackgroundDecoration = styled.View`
  position: absolute;
  top: -50px;
  right: -50px;
  width: 200px;
  height: 200px;
  border-radius: 100px;
  background-color: rgba(255,255,255,0.15);
`;

const BackgroundDecoration2 = styled.View`
  position: absolute;
  bottom: -30px;
  left: -30px;
  width: 120px;
  height: 120px;
  border-radius: 60px;
  background-color: rgba(255,255,255,0.12);
`;

const BackgroundDecoration3 = styled.View`
  position: absolute;
  top: 20px;
  left: -20px;
  width: 80px;
  height: 80px;
  border-radius: 40px;
  background-color: rgba(255,255,255,0.08);
`;

const BackgroundDecoration4 = styled.View`
  position: absolute;
  bottom: 40px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: rgba(255,255,255,0.1);
`;

const Title = styled.Text`
  font-size: 28px;
  font-weight: bold;
  color: white;
  text-align: center;
  margin-bottom: 10px;
`;

const Subtitle = styled.Text`
  font-size: 16px;
  color: #e3f2fd;
  text-align: center;
`;

const ButtonsContainer = styled.View`
  padding: 30px 20px;
  flex: 1;
  justify-content: center;
`;

const StyledButton = styled.TouchableOpacity`
  background-color: white;
  padding: 20px;
  margin: 10px 0;
  border-radius: 12px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 3;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const ButtonText = styled.Text`
  font-size: 18px;
  font-weight: 600;
  color: #333;
`;

const ButtonIcon = styled.Text`
  font-size: 20px;
  color: #2196f3;
`;

// Secciones coloridas estilo "Explorar"
const Section = styled.View`
  padding: 10px 20px 20px 20px;
`;
const SectionHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
`;
const SectionTitle = styled.Text`
  font-size: 22px;
  font-weight: 700;
  color: #212529;
`;
const SeeAll = styled.Text`
  color: #2196f3;
  font-weight: 600;
  font-size: 16px;
`;

// Tarjetas de categorías coloridas
const CategoriesGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: 0 20px;
  margin-bottom: 20px;
`;

// Tarjetas de acciones rápidas
const ActionsGrid = styled.View`
  flex-direction: row;
  justify-content: space-between;
  padding: 0 20px;
  margin-bottom: 20px;
`;
const ActionCard = styled.TouchableOpacity<{bgColor: string}>`
  flex: 1;
  height: 100px;
  background-color: ${props => props.bgColor};
  border-radius: 12px;
  margin: 0 6px;
  align-items: center;
  justify-content: center;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 3;
`;
const ActionIcon = styled.Text`
  font-size: 28px;
  margin-bottom: 8px;
`;
const ActionTitle = styled.Text`
  color: white;
  font-weight: 600;
  font-size: 14px;
  text-align: center;
`;
const ActionSubtitle = styled.Text`
  color: rgba(255,255,255,0.8);
  font-size: 11px;
  text-align: center;
`;
const CategoryCard = styled.TouchableOpacity<{bgColor: string}>`
  width: 48%;
  height: 80px;
  background-color: ${props => props.bgColor};
  border-radius: 12px;
  margin-bottom: 12px;
  align-items: center;
  justify-content: center;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 3;
`;
const CategoryIcon = styled.Text`
  font-size: 24px;
  margin-bottom: 4px;
`;
const CategoryName = styled.Text`
  color: white;
  font-weight: 600;
  font-size: 14px;
  text-align: center;
`;
const CategoryCount = styled.Text`
  color: rgba(255,255,255,0.8);
  font-size: 12px;
`;

const Chip = styled.TouchableOpacity`
  background-color: white;
  padding: 10px 14px;
  margin: 6px;
  border-radius: 20px;
  border-width: 1px;
  border-color: #e0e0e0;
`;
const ChipText = styled.Text`
  color: #333;
  font-weight: 600;
`;
const SearchBar = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: white;
  margin: 10px 20px 0 20px;
  border-radius: 12px;
  padding: 10px 12px;
  border-width: 1px;
  border-color: #e0e0e0;
`;
const SearchInput = styled.TextInput`
  flex: 1;
  color: #333;
`;
const ProductCard = styled.View`
  width: 160px;
  background-color: #fff;
  border-radius: 12px;
  margin-right: 12px;
  overflow: hidden;
`;
const ProductImage = styled.View`
  width: 100%;
  height: 110px;
  background-color: #e9edf3;
  align-items: center;
  justify-content: center;
`;
const ProductName = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: #333;
  padding: 8px 10px 0 10px;
`;
const ProductPrice = styled.Text`
  font-size: 13px;
  font-weight: 600;
  color: #2e7d32;
  padding: 2px 10px 10px 10px;
`;

// Nuevos componentes modernos para productos destacados
const ModernProductCard = styled.View`
  width: 130px;
  background-color: #fff;
  border-radius: 16px;
  margin-right: 16px;
  overflow: hidden;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.08;
  shadow-radius: 8px;
  elevation: 4;
`;
const ModernProductImage = styled.Image`
  width: 100%;
  height: 90px;
  resize-mode: cover;
`;
const PlaceholderImage = styled.View`
  width: 100%;
  height: 90px;
  background-color: #f8f9fa;
  align-items: center;
  justify-content: center;
`;
const ModernProductInfo = styled.View`
  padding: 12px;
`;
const ModernProductName = styled.Text`
  font-size: 13px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
`;
const ModernProductPrice = styled.Text`
  font-size: 14px;
  font-weight: 700;
  color: #27ae60;
`;
const Divider = styled.View`
  height: 1px;
  background-color: #e0e0e0;
  margin: 6px 20px 0 20px;
`;

const formatPrice = (price: number | string) => {
  const num = Number(price);
  if (isNaN(num)) return 'Precio no disponible';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export default function InicioScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0);
  const featuredScrollRef = React.useRef<FlatList>(null);
  const isMountedRef = React.useRef(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        if (!isMountedRef.current) return;
        setLoading(true);
        setLoadingCategories(true);
        
        // Cargar productos y categorías en paralelo
        const [pub, dest, cats] = await Promise.all([
          productService.getPublicProducts().catch(() => []),
          productService.getFeaturedProducts().catch(() => []),
          categoriasService.obtenerTodas().catch(() => [])
        ]);
        
        if (!isMountedRef.current) return;
        setProducts(pub);
        setFeatured(dest && dest.length ? dest : pub.slice(0, 10));
        setCategorias(cats);
      } catch (e) {
        console.error('❌ Error al cargar datos:', e);
        if (!isMountedRef.current) return;
        setProducts([]);
        setFeatured([]);
        setCategorias([]);
      } finally {
        if (!isMountedRef.current) return;
        setLoading(false);
        setLoadingCategories(false);
      }
    };
    fetchAll();
  }, []);

  // Auto-scroll para productos destacados
  useEffect(() => {
    if (featured.length > 1) {
      const interval = setInterval(() => {
        if (!isMountedRef.current) return;
        setCurrentFeaturedIndex(prevIndex => {
          const nextIndex = (prevIndex + 1) % featured.length;
          featuredScrollRef.current?.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
          return nextIndex;
        });
      }, 4000); // Cambiar cada 4 segundos

      return () => clearInterval(interval);
    }
  }, [featured.length]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach(p => map.set(p.category || 'Otros', (map.get(p.category || 'Otros') || 0) + 1));
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [products]);

  const filteredTrending = useMemo(() => {
    return (featured || []).filter(p => {
      const byQuery = (p.name?.toLowerCase().includes(query.toLowerCase()) || p.description?.toLowerCase().includes(query.toLowerCase()));
      const byCat = !selectedCategory || (p.category === selectedCategory);
      return byQuery && byCat;
    });
  }, [featured, query, selectedCategory]);

  const getCategoryCards = () => {
    const categoryColors = [
      { name: 'Electrónicos', icon: '📱', color: '#FF6B6B' },
      { name: 'Hogar', icon: '🏠', color: '#4ECDC4' },
      { name: 'Deportes', icon: '⚽', color: '#45B7D1' },
      { name: 'Moda', icon: '👕', color: '#96CEB4' },
      { name: 'Herramientas', icon: '🔧', color: '#FECA57' },
      { name: 'Belleza', icon: '💄', color: '#FF9FF3' },
    ];
    
    // Si tenemos categorías reales del backend, las usamos
    if (categorias.length > 0) {
      return categorias.slice(0, 6).map((categoria, index) => {
        const productCount = products.filter(p => p.category === categoria.nombre).length;
        const colorInfo = categoryColors.find(c => c.name === categoria.nombre) || categoryColors[index % categoryColors.length];
        
        return {
          id: categoria.id,
          name: categoria.nombre,
          count: productCount,
          icon: colorInfo.icon,
          color: colorInfo.color
        };
      });
    }
    
    // Si tenemos productos pero no categorías del backend, usar categorías de productos
    if (categories.length > 0) {
      return categories.slice(0, 6).map((cat, index) => ({
        name: cat.name,
        count: cat.count,
        icon: categoryColors[index % categoryColors.length].icon,
        color: categoryColors[index % categoryColors.length].color
      }));
    }
    
    // Si no, mostramos las categorías por defecto
    return categoryColors.map((cat, index) => ({ ...cat, count: 0 }));
  };

  const handleCategoryPress = (categoryName: string) => {
    // Navegar al catálogo con filtro de categoría
    router.push({
      pathname: '/catalogo/explore',
      params: { category: categoryName }
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: '¡Buenos días!', emoji: '🌅' };
    if (hour < 18) return { text: '¡Buenas tardes!', emoji: '☀️' };
    return { text: '¡Buenas noches!', emoji: '🌙' };
  };

  const greeting = getGreeting();

  return (
    <Container>
      <Header>
        <BackgroundDecoration />
        <BackgroundDecoration2 />
        <BackgroundDecoration3 />
        <BackgroundDecoration4 />
        <WelcomeContainer>
          <GreetingText>{greeting.text} {greeting.emoji}</GreetingText>
          <WelcomeMessage>Descubre productos increíbles en tu tienda favorita</WelcomeMessage>
        </WelcomeContainer>
      </Header>
      
      {/* Productos Destacados - Movido arriba con diseño moderno */}
      <Section>
        <SectionHeader>
          <SectionTitle>✨ Productos Destacados</SectionTitle>
          {loading ? <ActivityIndicator size="small" color="#2196f3" /> : <View />}
        </SectionHeader>

        
        <FlatList
          ref={featuredScrollRef}
          data={filteredTrending}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled={false}
          snapToInterval={140}
          decelerationRate="fast"
          contentContainerStyle={{ paddingLeft: 20, paddingRight: 20 }}
          onScrollToIndexFailed={(info) => {
            console.log('Scroll failed:', info);
          }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push({
                pathname: '/catalogo/[id]',
                params: { id: item.id }
              })}
            >
              <ModernProductCard>
                {item.image ? (
                  <ModernProductImage
                    source={{ uri: item.image }}
                    resizeMode="cover"
                  />
                ) : (
                  <PlaceholderImage>
                    <Text style={{ fontSize: 20 }}>📦</Text>
                  </PlaceholderImage>
                )}
                <ModernProductInfo>
                  <ModernProductName numberOfLines={1}>{item.name}</ModernProductName>
                  <ModernProductPrice>
                    {item.price ? formatPrice(item.price) : 'Precio no disponible'}
                  </ModernProductPrice>
                </ModernProductInfo>
              </ModernProductCard>
            </TouchableOpacity>
          )}
          ListEmptyComponent={!loading ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: '#666', fontSize: 16 }}>🔍 No hay productos destacados</Text>
              <Text style={{ color: '#999', fontSize: 14, marginTop: 4 }}>Revisa la conexión con el servidor</Text>
            </View>
          ) : null}
        />
      </Section>

      {/* Acciones rápidas */}
      <ActionsGrid>
        <ActionCard bgColor="#FF6B6B" onPress={() => router.push('/catalogo/visual')}>
          <ActionIcon>🛍️</ActionIcon>
          <ActionTitle>Catálogo</ActionTitle>
          <ActionSubtitle>Ver productos</ActionSubtitle>
        </ActionCard>
        <ActionCard bgColor="#4ECDC4" onPress={() => {
          // Scroll a la sección de destacados que ya está visible arriba
          featuredScrollRef.current?.scrollToIndex({ index: 0, animated: true });
        }}>
          <ActionIcon>⭐</ActionIcon>
          <ActionTitle>Destacados</ActionTitle>
          <ActionSubtitle>Lo mejor</ActionSubtitle>
        </ActionCard>
        <ActionCard bgColor="#45B7D1" onPress={() => router.push('/catalogo/explore?filter=ofertas')}>
          <ActionIcon>🏷️</ActionIcon>
          <ActionTitle>Ofertas</ActionTitle>
          <ActionSubtitle>Descuentos</ActionSubtitle>
        </ActionCard>
      </ActionsGrid>

      {/* Secciones estilo Explorar para tienda */}
      <SearchBar>
        <Text style={{ marginRight: 6 }}>🔍</Text>
        <SearchInput
          placeholder="Buscar productos, categorías..."
          placeholderTextColor="#999"
          value={query}
          onChangeText={setQuery}
        />
      </SearchBar>

      <Section>
        <SectionHeader>
          <SectionTitle>Categorías</SectionTitle>
          {loadingCategories ? (
            <ActivityIndicator size="small" color="#2196f3" />
          ) : (
            <TouchableOpacity onPress={() => router.push('/catalogo/explore')}>
              <SeeAll>Ver catálogo</SeeAll>
            </TouchableOpacity>
          )}
        </SectionHeader>
      </Section>
      
      <CategoriesGrid>
        {getCategoryCards().map((category, index) => (
          <CategoryCard 
            key={category.name || index} 
            bgColor={category.color}
            onPress={() => handleCategoryPress(category.name)}
          >
            <CategoryIcon>{category.icon}</CategoryIcon>
            <CategoryName>{category.name}</CategoryName>
            <CategoryCount>{category.count} productos</CategoryCount>
          </CategoryCard>
        ))}
      </CategoriesGrid>

      <Divider />

      {/* Estadísticas compactas */}
      <View style={{ padding: 20, paddingTop: 10 }}>
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-around', 
          backgroundColor: 'white', 
          borderRadius: 12, 
          padding: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3
        }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#667eea' }}>{products.length}</Text>
            <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>Productos</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#764ba2' }}>{categories.length}</Text>
            <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>Categorías</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FF6B6B' }}>{featured.length}</Text>
            <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>Destacados</Text>
          </View>
        </View>
      </View>
    </Container>
  );
}