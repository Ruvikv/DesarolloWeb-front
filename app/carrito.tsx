import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../contexts/CartContext';
import { pedidoService } from '../services/pedidoService';

export default function CarritoScreen() {
  const router = useRouter();
  const { items, totalItems, totalPrice, increaseQty, decreaseQty, removeItem, clear } = useCart();

  const [nombre, setNombre] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [telefono, setTelefono] = React.useState('');
  const [direccion, setDireccion] = React.useState('');
  const [enviando, setEnviando] = React.useState(false);

  const validar = (): boolean => {
    if (items.length === 0) {
      Alert.alert('Carrito vacío', 'No hay productos en tu carrito');
      return false;
    }
    if (!nombre.trim() || !email.trim() || !telefono.trim() || !direccion.trim()) {
      Alert.alert('Datos incompletos', 'Nombre, email, teléfono y dirección son obligatorios');
      return false;
    }
    const emailOk = /.+@.+\..+/.test(email.trim());
    if (!emailOk) {
      Alert.alert('Email inválido', 'Ingresa un email válido');
      return false;
    }
    return true;
  };

  const handleCheckout = async () => {
    if (!validar()) return;

    try {
      setEnviando(true);

      const itemsPayload = items.map((ci) => ({
        producto_id: String(ci.product.id),
        cantidad: Number(ci.quantity),
      }));

      const payload = {
        nombre: nombre.trim(),
        email: email.trim(),
        telefono: telefono.trim(),
        direccion: direccion.trim(),
        items: itemsPayload,
      } as const;

      await pedidoService.registrarPedidoConsumidor(payload as any);

      // Navegar a pantalla de éxito inmediatamente
      console.log('Navegando a /pedido/exito');
      router.push({
        pathname: '/pedido/exito',
        params: { nombre: payload.nombre, email: payload.email }
      });

      // Limpiar carrito y formulario después de iniciar la navegación
      clear();
      setNombre('');
      setEmail('');
      setTelefono('');
      setDireccion('');

    } catch (error: any) {
      const server = error?.response?.data;
      const backendMsg = server?.message || server?.error || server?.errors?.[0] || undefined;
      const msg = backendMsg || error?.message || 'No se pudo registrar el pedido. Intenta nuevamente.';
      console.warn('Error registrarPedidoConsumidor:', { request: 'POST /usuarios/pedido-consumidor', server });

      const detalleItems = items.map((i) => `${i.product.name} x ${i.quantity}`).join(', ');
      const cuerpoEmail = `Hola, no pude finalizar mi compra en la app.\n\nNombre: ${nombre}\nEmail: ${email}\nTeléfono: ${telefono}\nDirección: ${direccion}\n\nItems: ${detalleItems}\nTotal mostrado: $${totalPrice.toFixed(2)}\n\nMensaje backend: ${String(msg)}`;
      const mailtoUrl = `mailto:info@mitienda.com?subject=${encodeURIComponent('Pedido desde app - fallback')}&body=${encodeURIComponent(cuerpoEmail)}`;
      const whatsappText = `Hola, no pude finalizar mi compra.\n\nNombre: ${nombre}\nDirección: ${direccion}\nItems: ${detalleItems}\nTotal: $${totalPrice.toFixed(2)}`;
      const whatsappUrl = `https://wa.me/1234567890?text=${encodeURIComponent(whatsappText)}`;

      Alert.alert('Error', String(msg), [
        { text: 'Reintentar', onPress: handleCheckout },
        { text: 'Enviar email', onPress: () => Linking.openURL(mailtoUrl) },
        { text: 'WhatsApp', onPress: () => Linking.openURL(whatsappUrl) },
      ]);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tu Carrito</Text>
        <Text style={styles.subtitle}>{totalItems} items</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => it.product.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>Tu carrito está vacío</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.productName}>{item.product.name}</Text>
              <Text style={styles.productPrice}>${item.product.price?.toFixed(2)}</Text>
            </View>
            <View style={styles.qtyBox}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => decreaseQty(item.product.id)}>
                <Text style={styles.qtyBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qty}>{item.quantity}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => increaseQty(item.product.id)}>
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => removeItem(item.product.id)}>
              <Text style={styles.remove}>Quitar</Text>
            </TouchableOpacity>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.form}>
            <Text style={styles.formTitle}>Datos del comprador</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre *</Text>
              <TextInput
                style={styles.input}
                value={nombre}
                onChangeText={setNombre}
                placeholder="Tu nombre completo"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="tu@email.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Teléfono *</Text>
              <TextInput
                style={styles.input}
                value={telefono}
                onChangeText={setTelefono}
                placeholder="Ej: 1234567890"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Dirección *</Text>
              <TextInput
                style={styles.input}
                value={direccion}
                onChangeText={setDireccion}
                placeholder="Calle 123, Ciudad"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        }
      />

      <View style={styles.footer}>
        <View>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${totalPrice.toFixed(2)}</Text>
        </View>
        <TouchableOpacity style={[styles.checkoutBtn, enviando && { opacity: 0.7 }]} onPress={handleCheckout} disabled={enviando}>
          {enviando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.checkoutText}>Finalizar Compra</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 20, fontWeight: '700', color: '#333' },
  subtitle: { marginTop: 4, color: '#666' },
  listContent: { padding: 16 },
  empty: { textAlign: 'center', color: '#666', marginTop: 40 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 12 },
  productName: { fontWeight: '700', color: '#333' },
  productPrice: { marginTop: 4, color: '#7b1fa2' },
  qtyBox: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 10 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 16, fontWeight: '700' },
  qty: { width: 28, textAlign: 'center' },
  remove: { color: '#d32f2f', marginLeft: 8 },
  form: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginTop: 8 },
  formTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 12 },
  inputGroup: { marginBottom: 12 },
  label: { color: '#666', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  totalLabel: { color: '#666' },
  totalValue: { fontSize: 18, fontWeight: '800', color: '#333' },
  checkoutBtn: { backgroundColor: '#7b1fa2', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 },
  checkoutText: { color: '#fff', fontWeight: '700' },
});


