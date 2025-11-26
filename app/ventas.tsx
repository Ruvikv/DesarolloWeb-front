import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { notifyOperationSuccess } from '../services/notificationsService';
import ProtectedRoute from '../components/ProtectedRoute';
import { ProductoAdmin, calcularPrecioFinal, productosService } from '../services/productosService';
import { VentaMinorista, ventasService } from '../services/ventasService';

type CarritoItem = {
  producto: ProductoAdmin;
  cantidad: number;
  precio_venta: number;
  subtotal: number;
  ganancia: number;
};

const COLORS = {
  primary: '#667eea',
  text: '#333',
  subtext: '#666',
  border: '#ddd',
  bg: '#fff',
  chip: '#e0e0e0',
};

const METODOS_PAGO = ['Efectivo', 'Tarjeta', 'Transferencia', 'Mercado Pago', 'Otro'] as const;

function formatMoney(n: number): string {
  return `$ ${Number(n || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function VentasScreen() {
  // ============================================
  // ESTADO
  // ============================================
  const [productos, setProductos] = useState<ProductoAdmin[]>([]);
  const [ventas, setVentas] = useState<VentaMinorista[]>([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [mostrarVentas, setMostrarVentas] = useState(false);
  const [mostrarMetodo, setMostrarMetodo] = useState(false);

  // Búsqueda
  const [q, setQ] = useState('');

  // Producto seleccionado
  const [selected, setSelected] = useState<ProductoAdmin | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [precioVenta, setPrecioVenta] = useState(0);

  // Carrito (para múltiples productos)
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);

  // Datos de la venta
  const [nombreComprador, setNombreComprador] = useState('');
  const [metodoPago, setMetodoPago] = useState<typeof METODOS_PAGO[number] | ''>('');
  const [notas, setNotas] = useState('');
  const [requiereFactura, setRequiereFactura] = useState(false);
  const [fechaVenta, setFechaVenta] = useState(() => new Date().toISOString().split('T')[0]);

  // ============================================
  // COMPUTED
  // ============================================
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return productos;
    return productos.filter(p =>
      (p.nombre || '').toLowerCase().includes(term) ||
      (p.sku || '').toLowerCase().includes(term)
    );
  }, [q, productos]);

  const totalCarrito = useMemo(() =>
    carrito.reduce((acc, it) => acc + it.subtotal, 0),
    [carrito]
  );

  const gananciaCarrito = useMemo(() =>
    carrito.reduce((acc, it) => acc + it.ganancia, 0),
    [carrito]
  );

  const countVisual = useMemo(() =>
    carrito.length > 0 ? carrito.length : selected ? 1 : 0,
    [carrito, selected]
  );

  // ============================================
  // EFECTOS
  // ============================================
  useEffect(() => {
    cargarProductos();
  }, []);

  useEffect(() => {
    if (selected) {
      const pf = calcularPrecioFinal(selected);
      setPrecioVenta(Number(pf) || 0);
    }
  }, [selected]);

  useEffect(() => {
    if (mostrarVentas) cargarVentas();
  }, [mostrarVentas]);

  // ============================================
  // FUNCIONES
  // ============================================
  const cargarProductos = async () => {
    try {
      setLoading(true);
      const items = await productosService.listarActivos();
      setProductos(items || []);
      setConnected(true);
    } catch (e) {
      console.warn('Error al cargar productos:', e);
      setProductos([]);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const cargarVentas = async () => {
    try {
      setLoading(true);
      const v = await ventasService.listarMinoristas();
      setVentas(v || []);
    } catch (e) {
      console.warn('Error al cargar ventas:', e);
      setVentas([]);
    } finally {
      setLoading(false);
    }
  };

  const agregarAlCarrito = () => {
    if (!selected || cantidad <= 0 || precioVenta <= 0) {
      Alert.alert('Faltan datos', 'Selecciona producto, cantidad y precio.');
      return;
    }
    if ((selected.stock || 0) < cantidad) {
      Alert.alert('Stock insuficiente', `Stock disponible: ${selected.stock || 0}`);
      return;
    }

    const subtotal = cantidad * precioVenta;
    const base = (selected.precio_costo_ajustado ?? selected.precio_costo ?? 0) || 0;
    const ganancia = (precioVenta - base) * cantidad;

    const nuevo: CarritoItem = {
      producto: selected,
      cantidad,
      precio_venta: precioVenta,
      subtotal,
      ganancia,
    };

    setCarrito(prev => [...prev, nuevo]);

    // Limpiar selección
    setSelected(null);
    setCantidad(1);
    setPrecioVenta(0);
  };

  const quitarDelCarrito = (idx: number) => {
    setCarrito(prev => prev.filter((_, i) => i !== idx));
  };

  const limpiarFormulario = () => {
    setCarrito([]);
    setNombreComprador('');
    setMetodoPago('');
    setNotas('');
    setRequiereFactura(false);
    setFechaVenta(new Date().toISOString().split('T')[0]);
    setSelected(null);
    setCantidad(1);
    setPrecioVenta(0);
  };

  const registrarVenta = async () => {
    // Determinar items a registrar
    const itemsParaRegistrar: CarritoItem[] = carrito.length > 0
      ? carrito
      : selected
        ? [{
          producto: selected,
          cantidad,
          precio_venta: precioVenta,
          subtotal: cantidad * precioVenta,
          ganancia: (precioVenta - ((selected.precio_costo_ajustado ?? selected.precio_costo ?? 0) || 0)) * cantidad,
        }]
        : [];

    if (itemsParaRegistrar.length === 0) {
      Alert.alert('Faltan datos', 'Selecciona al menos un producto.');
      return;
    }

    if (!nombreComprador.trim()) {
      Alert.alert('Falta comprador', 'Ingresa el nombre del comprador.');
      return;
    }

    if (!metodoPago) {
      Alert.alert('Falta método de pago', 'Selecciona un método de pago.');
      return;
    }

    try {
      setLoading(true);

      // Una sola línea: usar endpoint minorista
      if (itemsParaRegistrar.length === 1) {
        const item = itemsParaRegistrar[0];

        // 🔍 DEBUG: Ver qué contiene el producto
        console.log('🔍 DEBUG - Item completo:', item);
        console.log('🔍 DEBUG - item.producto:', item.producto);
        console.log('🔍 DEBUG - item.producto.id:', item.producto?.id);
        console.log('🔍 DEBUG - selected:', selected);
        console.log('🔍 DEBUG - selected.id:', selected?.id);

        const payload = {
          producto_id: item.producto.id,
          cantidad: item.cantidad,
          precio_venta: item.precio_venta,
          nombre_comprador: nombreComprador.trim(),
          metodo_pago: metodoPago,
          notas: notas || undefined,
        };

        console.log('📦 PAYLOAD FINAL A ENVIAR:', payload);

        await ventasService.registrarMinorista(payload);

        Alert.alert('✅ Listo', 'Venta registrada correctamente.');
        // Confirmación de acción via notificación local
        notifyOperationSuccess('Venta registrada correctamente');
      }
      // Múltiples líneas: usar endpoint con carrito
      else {
        await ventasService.registrarVentaConCarrito({
          productos: itemsParaRegistrar.map(item => ({
            id: item.producto.id,
            cantidad: item.cantidad,
          })),
          cliente: nombreComprador.trim(),
          metodo_pago: metodoPago,
          notas: notas || undefined,
        });

        Alert.alert('✅ Listo', `Venta registrada con ${itemsParaRegistrar.length} productos.`);
        notifyOperationSuccess('Venta registrada correctamente');
      }

      limpiarFormulario();

      if (mostrarVentas) {
        await cargarVentas();
      }
    } catch (error: any) {
      Alert.alert('❌ Error', error?.message || 'No se pudo registrar la venta');
    } finally {
      setLoading(false);
    }
  };

  const exportarExcel = async () => {
    try {
      const blob = await ventasService.exportarExcelMinoristas();

      if (Platform.OS === 'web') {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ventas-minoristas.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } else {
        Alert.alert('Exportación', 'Disponible solo en la web por ahora.');
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo exportar el Excel');
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <ProtectedRoute>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View>
          <Text style={styles.title}>Ventas Minoristas</Text>
          <Text style={styles.subtitle}>Registra ventas directas a consumidores finales.</Text>

          <View style={[styles.badge, connected ? styles.badgeOk : styles.badgeFail, { alignSelf: 'flex-start', marginTop: 8 }]}>
            <Ionicons
              name={connected ? 'checkmark-circle' : 'close-circle'}
              size={16}
              color={connected ? '#2e7d32' : '#b71c1c'}
            />
            <Text style={[styles.badgeText, connected ? styles.badgeTextOk : styles.badgeTextFail]}>
              {connected ? 'Conectado al Backend' : 'Sin Conexión'}
            </Text>
          </View>
        </View>

        {/* Toggle Registrar / Ver */}
        <View style={styles.segmentRow}>
          <TouchableOpacity
            onPress={() => setMostrarVentas(false)}
            style={[styles.segmentBtn, !mostrarVentas && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, !mostrarVentas && styles.segmentTextActive]}>
              Registrar Venta
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setMostrarVentas(true)}
            style={[styles.segmentBtn, mostrarVentas && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, mostrarVentas && styles.segmentTextActive]}>
              Ver Ventas
            </Text>
          </TouchableOpacity>
        </View>

        {/* Contenido */}
        {!mostrarVentas ? (
          <View style={styles.card}>
            {/* Header del formulario */}
            <View style={styles.formHeader}>
              <Ionicons name="alert-circle" size={18} color="#f57c00" style={{ marginRight: 8 }} />
              <Text style={{ fontWeight: '700' }}>Registrar Nueva Venta (Consumidor Final)</Text>
            </View>

            {/* Selector de producto */}
            <Text style={styles.labelTop}>Producto</Text>
            {Platform.OS === 'web' ? (
              <View style={styles.selectInput}>
                {React.createElement('select', {
                  value: selected ? String(selected.id) : '',
                  onChange: (e: any) => {
                    const id = String(e.target.value);
                    const prod = productos.find(p => String(p.id) === id) || null;
                    setSelected(prod);
                  },
                  style: {
                    width: '100%',
                    height: 36,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                  } as any,
                }, [
                  React.createElement('option', { key: 'empty', value: '' }, 'Seleccionar producto'),
                  ...productos.map(p =>
                    React.createElement('option', { key: String(p.id), value: String(p.id) }, p.nombre || String(p.id))
                  ),
                ])}
              </View>
            ) : (
              <TouchableOpacity onPress={() => setMostrarMetodo(false)} style={styles.selectInput}>
                <Text style={{ color: selected ? COLORS.text : COLORS.subtext }}>
                  {selected ? (selected.nombre || 'Producto') : 'Seleccionar producto'}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#777" />
              </TouchableOpacity>
            )}

            {/* Cantidad y Costo */}
            <View style={styles.row2}>
              <View style={styles.colLeft}>
                <Text style={styles.label}>Cantidad</Text>
                <TextInput
                  keyboardType="numeric"
                  value={String(cantidad)}
                  onChangeText={(t) => setCantidad(Number(t) || 1)}
                  style={styles.input}
                />
              </View>
              <View style={styles.colRight}>
                <Text style={styles.label}>Costo Unitario</Text>
                <TextInput
                  editable={false}
                  value={selected ? String((selected.precio_costo_ajustado ?? selected.precio_costo ?? 0) || 0) : ''}
                  style={[styles.input, { backgroundColor: '#f7f7fb' }]}
                />
              </View>
            </View>

            {/* Precio Venta y Fecha */}
            <View style={styles.row2}>
              <View style={styles.colLeft}>
                <Text style={styles.label}>Precio Venta Unitario</Text>
                <TextInput
                  keyboardType="numeric"
                  value={String(precioVenta)}
                  onChangeText={(t) => setPrecioVenta(Number(t) || 0)}
                  style={styles.input}
                />
              </View>
              <View style={styles.colRight}>
                <Text style={styles.label}>
                  <Ionicons name="calendar-outline" size={14} color="#666" /> Fecha de Venta
                </Text>
                <TextInput
                  value={fechaVenta}
                  onChangeText={setFechaVenta}
                  placeholder="YYYY-MM-DD"
                  style={styles.input}
                />
              </View>
            </View>

            {/* Comprador y Método de Pago */}
            <View style={styles.row2}>
              <View style={styles.colLeft}>
                <Text style={styles.label}>Nombre del Comprador</Text>
                <TextInput
                  value={nombreComprador}
                  onChangeText={setNombreComprador}
                  style={styles.input}
                  placeholder="Ej: Juan Pérez"
                />
              </View>
              <View style={styles.colRight}>
                <Text style={styles.label}>
                  <Ionicons name="card-outline" size={14} color="#666" /> Método de Pago
                </Text>
                <TouchableOpacity
                  onPress={() => setMostrarMetodo(v => !v)}
                  style={styles.selectInput}
                >
                  <Text style={{ color: metodoPago ? COLORS.text : COLORS.subtext }}>
                    {metodoPago || 'Seleccionar método'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#777" />
                </TouchableOpacity>

                {mostrarMetodo && (
                  <View style={styles.dropdown}>
                    {METODOS_PAGO.map(m => (
                      <TouchableOpacity
                        key={m}
                        onPress={() => {
                          setMetodoPago(m);
                          setMostrarMetodo(false);
                        }}
                        style={styles.dropdownItem}
                      >
                        <Text>{m}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Notas */}
            <Text style={styles.label}>Notas Adicionales</Text>
            <TextInput
              value={notas}
              onChangeText={setNotas}
              style={[styles.input, { minHeight: 80 }]}
              multiline
              placeholder="Notas sobre la venta, cliente, etc."
            />

            {/* Factura */}
            <TouchableOpacity
              onPress={() => setRequiereFactura(v => !v)}
              style={styles.checkboxRow}
            >
              <Ionicons
                name={requiereFactura ? 'checkbox' : 'square-outline'}
                size={20}
                color={requiereFactura ? COLORS.primary : '#666'}
              />
              <Text style={{ marginLeft: 8 }}>Factura Emitida</Text>
            </TouchableOpacity>

            {/* Ganancia */}
            {selected && (
              <View style={{ marginTop: 8 }}>
                <Text style={styles.label}>Ganancia del Producto Actual</Text>
                <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primary }}>
                  {formatMoney((precioVenta - ((selected.precio_costo_ajustado ?? selected.precio_costo ?? 0) || 0)) * cantidad)}
                </Text>
              </View>
            )}

            {/* Botón Registrar */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
              <TouchableOpacity
                disabled={loading || countVisual === 0}
                onPress={registrarVenta}
                style={[
                  styles.primaryBtn,
                  { minWidth: 280 },
                  (loading || countVisual === 0) && styles.primaryBtnDisabled
                ]}
              >
                <Text style={styles.primaryBtnText}>
                  {loading
                    ? 'Guardando…'
                    : `Registrar Venta (${countVisual} producto${countVisual === 1 ? '' : 's'})`
                  }
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            {/* Header de ventas */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontWeight: '700' }}>Listado de Ventas</Text>
              <TouchableOpacity onPress={exportarExcel} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Exportar Excel</Text>
              </TouchableOpacity>
            </View>

            {/* Lista de ventas */}
            {ventas.length === 0 ? (
              <Text style={{ color: COLORS.subtext, marginTop: 10 }}>No hay ventas registradas</Text>
            ) : (
              ventas.map(v => (
                <View key={v.id} style={styles.saleRow}>
                  <Text style={{ fontWeight: '600' }}>{v.nombre_comprador || 'Comprador'}</Text>
                  <Text style={{ color: COLORS.subtext }}>Producto: {v.producto_id}</Text>
                  <Text style={{ color: COLORS.subtext }}>
                    Cant: {v.cantidad} · Unit: {formatMoney(v.precio_venta)}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </ProtectedRoute>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeOk: {
    backgroundColor: '#e8f5e9',
    borderColor: '#c8e6c9',
  },
  badgeFail: {
    backgroundColor: '#ffebee',
    borderColor: '#ffcdd2',
  },
  badgeText: {
    marginLeft: 6,
    fontWeight: '600',
  },
  badgeTextOk: {
    color: '#2e7d32',
  },
  badgeTextFail: {
    color: '#b71c1c',
  },
  segmentRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  segmentBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#eee',
    marginRight: 8,
  },
  segmentActive: {
    backgroundColor: COLORS.primary,
  },
  segmentText: {
    color: '#333',
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffe0b2',
    backgroundColor: '#fff3e0',
    marginBottom: 12,
  },
  labelTop: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 6,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  row2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  colLeft: {
    flex: 1,
    marginRight: 8,
    minWidth: 0,
  },
  colRight: {
    flex: 1,
    marginLeft: 8,
    minWidth: 0,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  saleRow: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
});
