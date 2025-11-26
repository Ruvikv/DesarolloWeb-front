import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PedidoExitoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ nombre?: string; email?: string }>();

  const nombre = (params?.nombre || '').toString();
  const email = (params?.email || '').toString();

  const displayName = nombre ? nombre.toUpperCase() : '';

  const handleContinue = () => {
    console.log('Navegando a /catalogo/visual');
    router.push('/catalogo/visual');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>¡Pedido realizado con éxito!</Text>
        {!!displayName && (
          <Text style={styles.subtitle}>Gracias por tu compra, {displayName}.</Text>
        )}
        {!!email && (
          <Text style={styles.body}>Hemos enviado un correo a <Text style={styles.bold}>{email}</Text> con los detalles de tu pedido y el enlace de pago.</Text>
        )}

        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Seguir comprando</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa', padding: 16 },
  card: { width: '100%', maxWidth: 720, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 40, paddingHorizontal: 24, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#1b5e20', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#333', marginBottom: 12 },
  body: { fontSize: 15, color: '#444', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  bold: { fontWeight: '700' },
  button: { backgroundColor: '#7b1fa2', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});