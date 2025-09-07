import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Linking } from 'react-native';
import styled from 'styled-components/native';
import { router } from 'expo-router';

// Styled Components
const Container = styled.ScrollView`
  flex: 1;
  background-color: #f8f9fa;
`;

const Header = styled.View`
  background-color: #667eea;
  padding: 60px 20px 40px 20px;
  align-items: center;
`;

const Title = styled.Text`
  font-size: 32px;
  font-weight: bold;
  color: white;
  text-align: center;
  margin-bottom: 10px;
`;

const Subtitle = styled.Text`
  font-size: 18px;
  color: #e3f2fd;
  text-align: center;
  line-height: 24px;
`;

const Section = styled.View`
  background-color: white;
  margin: 15px 20px;
  border-radius: 16px;
  padding: 24px;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.1;
  shadow-radius: 8px;
  elevation: 5;
`;

const SectionTitle = styled.Text`
  font-size: 22px;
  font-weight: 700;
  color: #333;
  margin-bottom: 16px;
  text-align: center;
`;

const SectionText = styled.Text`
  font-size: 16px;
  color: #555;
  line-height: 24px;
  text-align: center;
  margin-bottom: 12px;
`;

const FeatureGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-top: 20px;
`;

const FeatureCard = styled.TouchableOpacity`
  width: 48%;
  background-color: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 15px;
  align-items: center;
  border-width: 2px;
  border-color: #e9ecef;
`;

const FeatureIcon = styled.Text`
  font-size: 32px;
  margin-bottom: 12px;
`;

const FeatureTitle = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #333;
  text-align: center;
  margin-bottom: 8px;
`;

const FeatureDescription = styled.Text`
  font-size: 14px;
  color: #666;
  text-align: center;
  line-height: 20px;
`;

const ActionButton = styled.TouchableOpacity`
  background-color: #667eea;
  padding: 16px 32px;
  border-radius: 25px;
  align-items: center;
  margin: 20px 0;
  shadow-color: #667eea;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
  elevation: 6;
`;

const ActionButtonText = styled.Text`
  color: white;
  font-size: 18px;
  font-weight: 600;
`;

const InfoCard = styled.View`
  background-color: #f093fb;
  border-radius: 16px;
  padding: 24px;
  margin: 10px 0;
`;

const InfoTitle = styled.Text`
  font-size: 20px;
  font-weight: 700;
  color: white;
  margin-bottom: 12px;
  text-align: center;
`;

const InfoText = styled.Text`
  font-size: 16px;
  color: white;
  line-height: 22px;
  text-align: center;
`;

const ContactSection = styled.View`
  background-color: #e8f5e8;
  border-radius: 16px;
  padding: 24px;
  margin: 10px 0;
  border-left-width: 6px;
  border-left-color: #4caf50;
`;

const ContactTitle = styled.Text`
  font-size: 20px;
  font-weight: 700;
  color: #2e7d32;
  margin-bottom: 16px;
  text-align: center;
`;

const ContactItem = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 12px 0;
  border-bottom-width: 1px;
  border-bottom-color: #c8e6c9;
`;

const ContactIcon = styled.Text`
  font-size: 20px;
  margin-right: 12px;
  width: 30px;
`;

const ContactText = styled.Text`
  font-size: 16px;
  color: #2e7d32;
  flex: 1;
`;

export default function ExploreScreen() {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const features = [
    {
      id: 'quality',
      icon: '⭐',
      title: 'Calidad Premium',
      description: 'Productos seleccionados con los más altos estándares de calidad'
    },
    {
      id: 'delivery',
      icon: '🚚',
      title: 'Envío Rápido',
      description: 'Entrega en 24-48 horas en toda la ciudad'
    },
    {
      id: 'support',
      icon: '💬',
      title: 'Soporte 24/7',
      description: 'Atención al cliente disponible todos los días'
    },
    {
      id: 'warranty',
      icon: '🛡️',
      title: 'Garantía Total',
      description: 'Garantía extendida en todos nuestros productos'
    }
  ];

  const handleFeaturePress = (featureId: string) => {
    setSelectedFeature(selectedFeature === featureId ? null : featureId);
  };

  const handleContactPress = (type: string, value: string) => {
    switch (type) {
      case 'phone':
        Linking.openURL(`tel:${value}`);
        break;
      case 'email':
        Linking.openURL(`mailto:${value}`);
        break;
      case 'whatsapp':
        Linking.openURL(`https://wa.me/${value}`);
        break;
      default:
        break;
    }
  };

  const navigateToCatalog = () => {
    router.push('/catalogo/visual');
  };

  const navigateToContact = () => {
    router.push('/contacto/contacto');
  };

  return (
    <Container>
      <Header>
        <Title>Explora Nuestra Tienda</Title>
        <Subtitle>Descubre todo lo que tenemos para ofrecerte</Subtitle>
      </Header>

      <Section>
        <SectionTitle>🏪 Sobre Nosotros</SectionTitle>
        <SectionText>
          Somos una tienda comprometida con ofrecerte los mejores productos al mejor precio. 
          Con años de experiencia en el mercado, nos especializamos en brindarte una experiencia 
          de compra excepcional.
        </SectionText>
        <InfoCard>
          <InfoTitle>¿Por qué elegirnos?</InfoTitle>
          <InfoText>
            Combinamos calidad, precio y servicio para crear la mejor experiencia de compra. 
            Nuestro equipo está dedicado a tu satisfacción.
          </InfoText>
        </InfoCard>
      </Section>

      <Section>
        <SectionTitle>✨ Nuestros Servicios</SectionTitle>
        <FeatureGrid>
          {features.map((feature) => (
            <FeatureCard
              key={feature.id}
              onPress={() => handleFeaturePress(feature.id)}
              style={{
                borderColor: selectedFeature === feature.id ? '#667eea' : '#e9ecef',
                backgroundColor: selectedFeature === feature.id ? '#f0f4ff' : '#f8f9fa'
              }}
            >
              <FeatureIcon>{feature.icon}</FeatureIcon>
              <FeatureTitle>{feature.title}</FeatureTitle>
              <FeatureDescription>{feature.description}</FeatureDescription>
            </FeatureCard>
          ))}
        </FeatureGrid>
      </Section>

      <Section>
        <SectionTitle>🛍️ Comienza a Comprar</SectionTitle>
        <SectionText>
          ¿Listo para encontrar lo que necesitas? Explora nuestro catálogo completo 
          con filtros avanzados y encuentra exactamente lo que buscas.
        </SectionText>
        <ActionButton onPress={navigateToCatalog}>
          <ActionButtonText>Ver Catálogo Completo</ActionButtonText>
        </ActionButton>
      </Section>

      <Section>
        <ContactSection>
          <ContactTitle>📞 Contáctanos</ContactTitle>
          <ContactItem onPress={() => handleContactPress('phone', '+1234567890')}>
            <ContactIcon>📱</ContactIcon>
            <ContactText>+1 (234) 567-890</ContactText>
          </ContactItem>
          <ContactItem onPress={() => handleContactPress('email', 'info@mitienda.com')}>
            <ContactIcon>✉️</ContactIcon>
            <ContactText>info@mitienda.com</ContactText>
          </ContactItem>
          <ContactItem onPress={() => handleContactPress('whatsapp', '1234567890')}>
            <ContactIcon>💬</ContactIcon>
            <ContactText>WhatsApp: +1 (234) 567-890</ContactText>
          </ContactItem>
          <ContactItem onPress={navigateToContact}>
            <ContactIcon>📍</ContactIcon>
            <ContactText>Ver ubicación y más información</ContactText>
          </ContactItem>
        </ContactSection>
      </Section>

      <Section>
        <InfoCard>
          <InfoTitle>🎉 Ofertas Especiales</InfoTitle>
          <InfoText>
            ¡No te pierdas nuestras promociones exclusivas! Suscríbete a nuestro boletín 
            para recibir descuentos especiales y ser el primero en conocer nuestras novedades.
          </InfoText>
        </InfoCard>
      </Section>
    </Container>
  );
}