import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import styled from 'styled-components/native';
import catalogoClient, { Product } from '../../services/catalogoService';

const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: #f8f9fa;
`;

const Header = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 16px 20px;
  background-color: white;
  border-bottom-width: 1px;
  border-bottom-color: #e9ecef;
`;

const BackButton = styled.TouchableOpacity`
  padding: 8px;
  margin-right: 12px;
`;

const BackButtonText = styled.Text`
  font-size: 24px;
  color: #667eea;
`;

const HeaderTitle = styled.Text`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  flex: 1;
`;

const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 40px;
`;

const LoadingText = styled.Text`
  margin-top: 16px;
  color: #666;
  font-size: 16px;
`;

const ErrorContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 40px;
`;

const ErrorText = styled.Text`
  color: #dc3545;
  font-size: 16px;
  text-align: center;
  margin-bottom: 20px;
`;

const RetryButton = styled.TouchableOpacity`
  background-color: #667eea;
  padding: 12px 24px;
  border-radius: 8px;
`;

const RetryButtonText = styled.Text`
  color: white;
  font-weight: 600;
  font-size: 16px;
`;

const ProductContainer = styled.ScrollView`
  flex: 1;
`;

const ProductImageContainer = styled.View`
  width: 100%;
  height: 300px;
  background-color: white;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
`;

const ProductImage = styled.Image`
  width: 100%;
  height: 100%;
  resize-mode: cover;
`;

const ImagePlaceholder = styled.View`
  width: 100%;
  height: 100%;
  background-color: #e9ecef;
  align-items: center;
  justify-content: center;
`;

const PlaceholderText = styled.Text`
  color: #6c757d;
  font-size: 16px;
  margin-top: 8px;
`;

const ProductInfo = styled.View`
  background-color: white;
  padding: 20px;
  margin: 0 16px 16px 16px;
  border-radius: 12px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 3;
`;

const ProductName = styled.Text`
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
`;

const ProductCategory = styled.Text`
  font-size: 14px;
  color: #667eea;
  font-weight: 600;
  margin-bottom: 12px;
  text-transform: uppercase;
`;

const ProductPrice = styled.Text`
  font-size: 28px;
  font-weight: bold;
  color: #28a745;
  margin-bottom: 16px;
`;

const ProductDescription = styled.Text`
  font-size: 16px;
  color: #555;
  line-height: 24px;
  margin-bottom: 16px;
`;

const StockContainer = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 20px;
`;

const StockLabel = styled.Text`
  font-size: 16px;
  color: #333;
  font-weight: 600;
  margin-right: 8px;
`;

const StockValue = styled.Text<{ stock: number }>`
  font-size: 16px;
  color: ${props => props.stock > 0 ? '#28a745' : '#dc3545'};
  font-weight: 600;
`;

const ActionButton = styled.TouchableOpacity<{ disabled?: boolean }>`
  background-color: ${props => props.disabled ? '#6c757d' : '#667eea'};
  padding: 16px;
  border-radius: 12px;
  align-items: center;
  margin-top: 8px;
`;

const ActionButtonText = styled.Text`
  color: white;
  font-size: 18px;
  font-weight: bold;
`;

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProduct = async () => {
    if (!id) {
      setError('ID de producto no válido');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const productData = await catalogoClient.getProductById(id);
      setProduct(productData);
    } catch (err) {
      console.error('Error al cargar producto:', err);
      setError('No se pudo cargar el producto. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    
    if (product.stock <= 0) {
      Alert.alert('Sin stock', 'Este producto no está disponible en este momento.');
      return;
    }

    Alert.alert(
      'Producto agregado',
      `${product.name} ha sido agregado al carrito.`,
      [{ text: 'OK' }]
    );
  };

  const handleGoBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <Container>
        <Header>
          <BackButton onPress={handleGoBack}>
            <BackButtonText>←</BackButtonText>
          </BackButton>
          <HeaderTitle>Cargando...</HeaderTitle>
        </Header>
        <LoadingContainer>
          <ActivityIndicator size="large" color="#667eea" />
          <LoadingText>Cargando detalles del producto...</LoadingText>
        </LoadingContainer>
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container>
        <Header>
          <BackButton onPress={handleGoBack}>
            <BackButtonText>←</BackButtonText>
          </BackButton>
          <HeaderTitle>Error</HeaderTitle>
        </Header>
        <ErrorContainer>
          <ErrorText>{error || 'Producto no encontrado'}</ErrorText>
          <RetryButton onPress={loadProduct}>
            <RetryButtonText>Reintentar</RetryButtonText>
          </RetryButton>
        </ErrorContainer>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <BackButton onPress={handleGoBack}>
          <BackButtonText>←</BackButtonText>
        </BackButton>
        <HeaderTitle>Detalle del Producto</HeaderTitle>
      </Header>
      
      <ProductContainer>
        <ProductImageContainer>
          {product.image ? (
            <ProductImage source={{ uri: product.image }} />
          ) : (
            <ImagePlaceholder>
              <Text style={{ fontSize: 48, color: '#6c757d' }}>📦</Text>
              <PlaceholderText>Sin imagen disponible</PlaceholderText>
            </ImagePlaceholder>
          )}
        </ProductImageContainer>

        <ProductInfo>
          <ProductCategory>{product.category}</ProductCategory>
          <ProductName>{product.name}</ProductName>
          <ProductPrice>${product.price?.toFixed?.(2) ?? product.price}</ProductPrice>
          
          {product.description && (
            <ProductDescription>{product.description}</ProductDescription>
          )}
          
          <StockContainer>
            <StockLabel>Stock disponible:</StockLabel>
            <StockValue stock={product.stock}>
              {product.stock > 0 ? `${product.stock} unidades` : 'Sin stock'}
            </StockValue>
          </StockContainer>

          <ActionButton 
            onPress={handleAddToCart}
            disabled={product.stock <= 0}
          >
            <ActionButtonText>
              {product.stock > 0 ? 'Agregar al Carrito' : 'Sin Stock'}
            </ActionButtonText>
          </ActionButton>
        </ProductInfo>
      </ProductContainer>
    </Container>
  );
}