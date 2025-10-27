import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Platform,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { geolocationService } from '../../services/apiService';
import AddressAutocomplete from '../../components/AddressAutocomplete';


const { width } = Dimensions.get('window');

// Styled Components
const Container = styled.View`
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

const Title = styled.Text`
  font-size: 28px;
  font-weight: bold;
  color: white;
  text-align: center;
  margin-bottom: 8px;
  text-shadow: 0px 2px 4px rgba(0,0,0,0.3);
`;

const Subtitle = styled.Text`
  font-size: 16px;
  color: #e3f2fd;
  text-align: center;
`;

// Decoraciones de fondo, igual que en Inicio
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

const ScrollContainer = styled.ScrollView`
  flex: 1;
`;

const Section = styled.View`
  margin-bottom: 30px;
`;

const SectionTitle = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: #212529;
  padding-horizontal: 20px;
  margin-bottom: 15px;
`;

const FormContainer = styled.View`
  padding-horizontal: 20px;
`;

const InputGroup = styled.View`
  margin-bottom: 20px;
`;

const Label = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #495057;
  margin-bottom: 8px;
`;

const Input = styled.TextInput`
  background-color: #fff;
  border-width: 1px;
  border-color: #ced4da;
  border-radius: 8px;
  padding-horizontal: 16px;
  padding-vertical: 12px;
  font-size: 16px;
  color: #495057;
`;

const TextArea = styled.TextInput`
  background-color: #fff;
  border-width: 1px;
  border-color: #ced4da;
  border-radius: 8px;
  padding-horizontal: 16px;
  padding-vertical: 12px;
  font-size: 16px;
  color: #495057;
  height: 120px;
  text-align-vertical: top;
`;

const SubmitButton = styled.TouchableOpacity`
  background-color: #667eea;
  padding-vertical: 16px;
  border-radius: 8px;
  align-items: center;
  margin-top: 10px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 3;
`;

const SubmitButtonText = styled.Text`
  color: #fff;
  font-size: 16px;
  font-weight: bold;
`;

const ContactCardsContainer = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  padding-horizontal: 20px;
`;

const ContactCard = styled.TouchableOpacity`
  width: ${(width - 60) / 2}px;
  background-color: #fff;
  padding: 20px;
  border-radius: 12px;
  align-items: center;
  margin-bottom: 15px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3.84px;
  elevation: 5;
`;

const ContactIcon = styled.Text`
  font-size: 32px;
  margin-bottom: 12px;
`;

const ContactTitle = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: #212529;
  margin-bottom: 4px;
  text-align: center;
`;

const ContactInfo = styled.Text`
  font-size: 14px;
  color: #6c757d;
  text-align: center;
`;

const BusinessHoursContainer = styled.View`
  background-color: #fff;
  margin-horizontal: 20px;
  padding: 20px;
  border-radius: 12px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3.84px;
  elevation: 5;
`;

const HoursRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-vertical: 8px;
  border-bottom-width: 1px;
  border-bottom-color: #f8f9fa;
`;

const DayText = styled.Text`
  font-size: 16px;
  color: #495057;
  font-weight: 500;
`;

const TimeText = styled.Text`
  font-size: 16px;
  color: #6c757d;
`;

const MapContainer = styled.View`
  height: 200px;
  margin: 0 20px 20px 20px;
  border-radius: 12px;
  overflow: hidden;
  background-color: #fff;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3.84px;
  elevation: 5;
`;

export default function ContactoScreen() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [direccionEnvio, setDireccionEnvio] = useState('');
  const [costoBase, setCostoBase] = useState('');
  const [calculandoEnvio, setCalculandoEnvio] = useState(false);
  const [resultadoEnvio, setResultadoEnvio] = useState<string | null>(null);

  const [direccionTiendas, setDireccionTiendas] = useState('');
  const [buscandoTiendas, setBuscandoTiendas] = useState(false);
  const [tiendas, setTiendas] = useState<any[]>([]);
  const [coordsMapa, setCoordsMapa] = useState<{ lat: number; lng: number } | null>(null);
  const [coordsTienda, setCoordsTienda] = useState<{ lat: number; lng: number } | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.email || !formData.message) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }
    Alert.alert('Éxito', 'Tu mensaje ha sido enviado correctamente');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const openPhone = () => {
    Linking.openURL('tel:+1234567890');
  };

  const openEmail = () => {
    Linking.openURL('mailto:contacto@tienda.com');
  };

  const openLocation = () => {
    Linking.openURL('https://maps.google.com/?q=Calle+Gaming+123');
  };

  // Fallback de geocodificación directo a Nominatim en caso de que falle el backend
  const geocodeFallback = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
      const resp = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      const json = await resp.json();
      if (Array.isArray(json) && json.length > 0 && json[0]?.lat && json[0]?.lon) {
        const lat = parseFloat(json[0].lat);
        const lng = parseFloat(json[0].lon);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          return { lat, lng };
        }
      }
      return null;
    } catch (err) {
      console.warn('Geocode fallback error:', err);
      return null;
    }
  };

  const calcularCostoEnvio = async () => {
    if (!direccionEnvio || !costoBase) {
      Alert.alert('Atención', 'Ingresa dirección y costo base');
      return;
    }
    try {
      setCalculandoEnvio(true);
      setResultadoEnvio(null);
      const res = await geolocationService.calculateShippingCost(direccionEnvio, Number(costoBase));
      const texto = `Costo estimado: ${res.costo}${res.moneda ? ' ' + res.moneda : ''}`;
      setResultadoEnvio(texto);
    } catch (e) {
      Alert.alert('Error', 'No se pudo calcular el costo de envío');
    } finally {
      setCalculandoEnvio(false);
    }
  };

  const buscarTiendasCercanas = async () => {
    if (!direccionTiendas) {
      Alert.alert('Atención', 'Ingresa una dirección para buscar tiendas cercanas');
      return;
    }
    try {
      setBuscandoTiendas(true);
      setTiendas([]);
      const coords = await geolocationService.getCoordinatesFromAddress(direccionTiendas);
      setCoordsMapa(coords);
      const lista = await geolocationService.getNearbyStores(coords.lat, coords.lng, 5);
      setTiendas(lista || []);
    } catch (e) {
      Alert.alert('Error', 'No se pudieron obtener tiendas cercanas');
    } finally {
      setBuscandoTiendas(false);
    }
  };

  const buscarTiendasConMiUbicacion = async () => {
    try {
      setBuscandoTiendas(true);
      setTiendas([]);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'No se otorgó permiso de ubicación. Puedes ingresar una dirección manualmente.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setCoordsMapa({ lat, lng });

      const url =
      Platform.OS === 'ios'
        ? `maps:0,0?q=${lat},${lng}`
        : `geo:${lat},${lng}?q=${lat},${lng}`;
      await Linking.openURL(url);

      const lista = await geolocationService.getNearbyStores(lat, lng, 5);
      setTiendas(lista || []);
    } catch (e) {
      Alert.alert('Error', 'No se pudo obtener tu ubicación actual');
    } finally {
      setBuscandoTiendas(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        let coords = await geolocationService.getCoordinatesFromAddress('Calle Gaming 123');
        if (!coords || !Number.isFinite(coords.lat) || !Number.isFinite(coords.lng)) {
          coords = await geocodeFallback('Calle Gaming 123') || coords;
        }
        if (coords && mounted) setCoordsTienda(coords);
      } catch (e) {
        const alt = await geocodeFallback('Calle Gaming 123');
        if (alt && mounted) setCoordsTienda(alt);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const abrirEnMapas = (lat: number, lng: number, nombre?: string) => {
    const label = nombre ? encodeURIComponent(nombre) : 'Tienda';
    const url = `https://maps.google.com/?q=${lat},${lng}(${label})`;
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Container>
        <ScrollContainer showsVerticalScrollIndicator={false}>
          {/* Header */}
          <Header>
            <BackgroundDecoration />
            <BackgroundDecoration2 />
            <BackgroundDecoration3 />
            <BackgroundDecoration4 />
            <Title>Contáctanos</Title>
            <Subtitle>Estamos aquí para ayudarte</Subtitle>
          </Header>

          {/* Contact Info Cards */}
          <Section>
            <ContactCardsContainer>
              <ContactCard onPress={openPhone}>
                <ContactIcon>
                  <Ionicons name="call-outline" size={36} color="#667eea" />
                </ContactIcon>
                <ContactTitle>Teléfono</ContactTitle>
                <ContactInfo>+1 (234) 567-8900</ContactInfo>
              </ContactCard>

              <ContactCard onPress={openEmail}>
                <ContactIcon>
                  <Ionicons name="mail-outline" size={36} color="#667eea" />
                </ContactIcon>
                <ContactTitle>Email</ContactTitle>
                <ContactInfo>contacto@tienda.com</ContactInfo>
              </ContactCard>

              <ContactCard onPress={openLocation}>
                <ContactIcon>
                  <Ionicons name="location-outline" size={36} color="#667eea" />
                </ContactIcon>
                <ContactTitle>Ubicación</ContactTitle>
                <ContactInfo>Calle Gaming 123</ContactInfo>
              </ContactCard>
            </ContactCardsContainer>
          </Section>

          {/* Mapa de la tienda */}
          <Section>
            <SectionTitle>Ubicación en el mapa</SectionTitle>
            <MapContainer>
              {Platform.select({
                web: (
                  coordsTienda ? (
                    <iframe
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${coordsTienda.lng-0.01},${coordsTienda.lat-0.01},${coordsTienda.lng+0.01},${coordsTienda.lat+0.01}&layer=mapnik&marker=${coordsTienda.lat},${coordsTienda.lng}`}
                      style={{ width: '100%', height: 200, border: 0 }}
                      allowFullScreen
                      loading="lazy"
                    />
                  ) : (
                    <TouchableOpacity onPress={openLocation} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa' }}>
                      <Ionicons name="map-outline" size={48} color="#6c757d" />
                      <Text style={{ color: '#6c757d', marginTop: 8 }}>Abrir en Maps</Text>
                    </TouchableOpacity>
                  )
                ),
                default: (
                  coordsTienda ? (
                    <TouchableOpacity onPress={openLocation} style={{ flex: 1 }}>
                      <Image
                        source={{
                          uri: `https://staticmap.openstreetmap.de/staticmap.php?center=${coordsTienda.lat},${coordsTienda.lng}&zoom=15&size=400x200&markers=${coordsTienda.lat},${coordsTienda.lng},red-pushpin`
                        }}
                        style={{ width: '100%', height: 200 }}
                        resizeMode="cover"
                      />
                      <View style={{
                        position: 'absolute',
                        bottom: 10,
                        right: 10,
                        backgroundColor: 'rgba(102, 126, 234, 0.85)',
                        paddingHorizontal: 8,
                        paddingVertical: 6,
                        borderRadius: 6
                      }}>
                        <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                          Toca para abrir en Maps
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={openLocation} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#666' }}>Abrir en Maps</Text>
                    </TouchableOpacity>
                  )
                )
              })}
            </MapContainer>
          </Section>

          {/* Envío: costo estimado por dirección */}
          <Section>
            <SectionTitle>Costo de envío (estimado)</SectionTitle>
            <FormContainer>
              <InputGroup>
                <Label>Dirección</Label>
                <Input
                  value={direccionEnvio}
                  onChangeText={setDireccionEnvio}
                  placeholder="Calle 123, Ciudad"
                  placeholderTextColor="#999"
                />
              </InputGroup>
              <InputGroup>
                <Label>Costo base</Label>
                <Input
                  value={costoBase}
                  onChangeText={setCostoBase}
                  placeholder="Ej: 1000"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </InputGroup>
              <SubmitButton onPress={calcularCostoEnvio}>
                {calculandoEnvio ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <SubmitButtonText>Calcular</SubmitButtonText>
                )}
              </SubmitButton>
              {resultadoEnvio && (
                <ContactInfo style={{ marginTop: 10, textAlign: 'center' }}>{resultadoEnvio}</ContactInfo>
              )}
            </FormContainer>
          </Section>

          {/* Tiendas cercanas a una dirección */}
          <Section>
            <SectionTitle>Tiendas cercanas por dirección</SectionTitle>
            <FormContainer>
              <InputGroup>
                <Label>Dirección</Label>
                <AddressAutocomplete
                  value={direccionTiendas}
                  onAddressSelect={setDireccionTiendas}
                  placeholder="Calle 123, Ciudad"
                />
              </InputGroup>
              <SubmitButton onPress={buscarTiendasCercanas}>
                {buscandoTiendas ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <SubmitButtonText>Buscar</SubmitButtonText>
                )}
              </SubmitButton>
              <SubmitButton onPress={buscarTiendasConMiUbicacion}>
                {buscandoTiendas ? (
                  <ActivityIndicator color="#241212ff" />
                ) : (
                  <SubmitButtonText>Usar mi ubicación</SubmitButtonText>
                )}
              </SubmitButton>

              {coordsMapa && (
                <MapContainer>
                  {Platform.select({
                    web: (
                      <iframe
                        src={`https://www.google.com/maps?q=${coordsMapa.lat},${coordsMapa.lng}&z=14&output=embed`}
                        style={{ width: '100%', height: 200, border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    ),
                    default: (
                      <TouchableOpacity onPress={() => abrirEnMapas(coordsMapa.lat, coordsMapa.lng)} style={{ flex: 1 }}>
                        <Image
                          source={{
                            uri: `https://staticmap.openstreetmap.de/staticmap.php?center=${coordsMapa.lat},${coordsMapa.lng}&zoom=14&size=400x200&markers=${coordsMapa.lat},${coordsMapa.lng},red-pushpin`
                          }}
                          style={{ width: '100%', height: 200 }}
                          resizeMode="cover"
                        />
                        <View style={{
                          position: 'absolute',
                          bottom: 10,
                          right: 10,
                          backgroundColor: 'rgba(102, 126, 234, 0.85)',
                          paddingHorizontal: 8,
                          paddingVertical: 6,
                          borderRadius: 6
                        }}>
                          <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                            Toca para abrir en Maps
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )
                  })}
                </MapContainer>
              )}

              {tiendas.map((t, idx) => (
                <ContactCard key={`${t.id || idx}`} onPress={() => abrirEnMapas(t.lat, t.lng, t.nombre)}>
                  <ContactIcon>
                    <Ionicons name="business-outline" size={32} color="#667eea" />
                  </ContactIcon>
                  <ContactTitle>{t.nombre || 'Tienda cercana'}</ContactTitle>
                  <ContactInfo>
                    {t.direccion || `${t.lat.toFixed(4)}, ${t.lng.toFixed(4)}`}
                    {t.distanciaKm ? ` · ${t.distanciaKm.toFixed(2)} km` : ''}
                  </ContactInfo>
                </ContactCard>
              ))}
            </FormContainer>
          </Section>

          {/* Contact Form */}
          <Section>
            <SectionTitle>Envíanos un mensaje</SectionTitle>
            <FormContainer>
          
              <InputGroup>
                <Label>Nombre *</Label>
                <Input
                  value={formData.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                  placeholder="Tu nombre completo"
                  placeholderTextColor="#999"
                />
              </InputGroup>

              <InputGroup>
                <Label>Email *</Label>
                <Input
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  placeholder="tu@email.com"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </InputGroup>

              <InputGroup>
                <Label>Asunto</Label>
                <Input
                  value={formData.subject}
                  onChangeText={(value) => handleInputChange('subject', value)}
                  placeholder="Asunto del mensaje"
                  placeholderTextColor="#999"
                />
              </InputGroup>

              <InputGroup>
                <Label>Mensaje *</Label>
                <TextArea
                  value={formData.message}
                  onChangeText={(value) => handleInputChange('message', value)}
                  placeholder="Escribe tu mensaje aquí..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                />
              </InputGroup>

              <SubmitButton onPress={handleSubmit}>
                <SubmitButtonText>Enviar Mensaje</SubmitButtonText>
              </SubmitButton>
            </FormContainer>
          </Section>

          {/* Business Hours */}
          <Section>
            <SectionTitle>Horarios de Atención</SectionTitle>
            <BusinessHoursContainer>
              <HoursRow>
                <DayText>Lunes - Viernes:</DayText>
                <TimeText>9:00 AM - 6:00 PM</TimeText>
              </HoursRow>
              <HoursRow>
                <DayText>Sábados:</DayText>
                <TimeText>10:00 AM - 4:00 PM</TimeText>
              </HoursRow>
              <HoursRow>
                <DayText>Domingos:</DayText>
                <TimeText>Cerrado</TimeText>
              </HoursRow>
            </BusinessHoursContainer>
          </Section>
        </ScrollContainer>
      </Container>
    </SafeAreaView>
  );
}