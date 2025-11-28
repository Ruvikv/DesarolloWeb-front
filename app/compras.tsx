import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';
import styled from 'styled-components/native';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationsContext';
import { CompraItemInput, CompraListado, comprasService } from '../services/comprasService';
import { notifyOperationSuccess } from '../services/notificationsService';

// UUID generator para React Native
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

// ============================================
// STYLED COMPONENTS
// ============================================

const Container = styled.View`
  flex: 1;
  background-color: #f8f9fa;
`;

const Header = styled.View<{ height: number }>`
  background-color: #667eea;
  padding: 16px;
  padding-top: 40px;
  height: ${(props) => props.height}px;
  justify-content: center;
`;

const HeaderTitle = styled.Text`
  color: #ffffff;
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 4px;
`;

const HeaderSubtitle = styled.Text`
  color: #e0e7ff;
  font-size: 14px;
`;

const Section = styled.View<{ margin?: string }>`
  background-color: #ffffff;
  border-radius: 12px;
  padding: 16px;
  margin: ${(props) => props.margin || '12px'};
  shadow-color: #000;
  shadow-opacity: 0.08;
  shadow-radius: 8px;
  elevation: 3;
`;

const SectionTitle = styled.Text`
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 12px;
`;

const Label = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
`;

const Input = styled.TextInput`
  background-color: #f9fafb;
  border-width: 1px;
  border-color: #d1d5db;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  color: #1f2937;
`;

const Button = styled.TouchableOpacity<{ variant?: 'primary' | 'danger' | 'secondary' | 'success' }>`
  background-color: ${(props) =>
        props.variant === 'danger'
            ? '#ef4444'
            : props.variant === 'secondary'
                ? '#6b7280'
                : props.variant === 'success'
                    ? '#10b981'
                    : '#667eea'};
  padding: 12px 16px;
  border-radius: 8px;
  align-items: center;
  justify-content: center;
  min-height: 48px;
`;

const ButtonText = styled.Text`
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
`;

const ItemCard = styled.View`
  background-color: #f9fafb;
  border-width: 1px;
  border-color: #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
`;

const Row = styled.View<{ gap?: number; wrap?: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: ${(props) => props.gap || 8}px;
  ${(props) => props.wrap && 'flex-wrap: wrap;'}
`;

const CompraCard = styled.View`
  background-color: #ffffff;
  border-width: 1px;
  border-color: #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  shadow-color: #000;
  shadow-opacity: 0.05;
  shadow-radius: 4px;
  elevation: 2;
`;

const Badge = styled.View<{ color?: string }>`
  background-color: ${(props) => props.color || '#e0e7ff'};
  padding: 4px 8px;
  border-radius: 12px;
`;

const BadgeText = styled.Text<{ color?: string }>`
  color: ${(props) => props.color || '#667eea'};
  font-size: 12px;
  font-weight: 600;
`;

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

function ComprasScreen() {
    const router = useRouter();
    const { logout } = useAuth();
    const { width } = useWindowDimensions();
    const isMobile = width < 640;
    const { addNotification } = useNotification();

    // Formulario de registro
    const [proveedor, setProveedor] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [items, setItems] = useState<CompraItemInput[]>([
        { id: generateUUID(), nombre: '', producto_id: '', cantidad: 1, precio_unitario: 0 },
    ]);
    const [enviando, setEnviando] = useState(false);

    // Listado de compras
    const [compras, setCompras] = useState<CompraListado[]>([]);
    const [cargandoCompras, setCargandoCompras] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Modal detalles
    const [modalDetalle, setModalDetalle] = useState(false);
    const [compraSeleccionada, setCompraSeleccionada] = useState<CompraListado | null>(null);

    useEffect(() => {
        cargarCompras();
    }, []);

    async function cargarCompras() {
        try {
            setCargandoCompras(true);
            const data = await comprasService.listarCompras();
            setCompras(data);
        } catch (e: any) {
            console.error('Error al cargar compras:', e);
            Alert.alert('Error', 'No se pudieron cargar las compras');
        } finally {
            setCargandoCompras(false);
            setRefreshing(false);
        }
    }

    function agregarItem() {
        setItems((prev) => [
            ...prev,
            { id: generateUUID(), nombre: '', producto_id: '', cantidad: 1, precio_unitario: 0 },
        ]);
    }

    function eliminarItem(id: string) {
        if (items.length === 1) {
            Alert.alert('Atención', 'Debe haber al menos un ítem');
            return;
        }
        setItems((prev) => prev.filter((it) => it.id !== id));
    }

    function editarItem(id: string, campo: keyof CompraItemInput, valor: string | number) {
        setItems((prev) =>
            prev.map((it) => (it.id === id ? { ...it, [campo]: valor } : it))
        );
    }

    function totalCompra(): number {
        return items.reduce(
            (acc, it) => acc + (Number(it.cantidad) || 0) * (Number(it.precio_unitario) || 0),
            0
        );
    }

    async function registrarCompra() {
        try {
            // Validaciones
            if (!proveedor.trim()) {
                Alert.alert('Error', 'Proveedor es requerido');
                return;
            }

            if (items.length === 0) {
                Alert.alert('Error', 'Debe agregar al menos un ítem');
                return;
            }

            for (let idx = 0; idx < items.length; idx++) {
                const it = items[idx];
                const tieneIdentificador = (it.nombre && it.nombre.trim()) || (it.producto_id && it.producto_id.trim());
                if (!tieneIdentificador) {
                    Alert.alert('Error', `Ítem ${idx + 1}: ingrese nombre o producto_id`);
                    return;
                }
                if (!Number.isFinite(it.cantidad) || it.cantidad <= 0) {
                    Alert.alert('Error', `Ítem ${idx + 1}: cantidad debe ser mayor a 0`);
                    return;
                }
                if (!Number.isFinite(it.precio_unitario) || it.precio_unitario < 0) {
                    Alert.alert('Error', `Ítem ${idx + 1}: precio_unitario debe ser >= 0`);
                    return;
                }
            }

            setEnviando(true);

            await comprasService.registrarCompra({
                proveedor: proveedor.trim(),
                observaciones: observaciones.trim() || undefined,
                productos: items.map((it) => ({
                    nombre: it.nombre?.trim() || undefined,
                    producto_id: it.producto_id?.trim() || undefined,
                    cantidad: Number(it.cantidad),
                    precio_unitario: Number(it.precio_unitario),
                })),
            });

            // Reset form
            setProveedor('');
            setObservaciones('');
            setItems([{ id: generateUUID(), nombre: '', producto_id: '', cantidad: 1, precio_unitario: 0 }]);

            Alert.alert('Éxito', 'Compra registrada correctamente');
            notifyOperationSuccess('Compra registrada correctamente');

            // Agregar notificación in-app
            addNotification({
                type: 'info',
                title: '📦 Compra Registrada',
                message: `Compra a ${proveedor} por $${totalCompra().toFixed(2)}`,
                route: '/compras',
            });

            await cargarCompras();
        } catch (e: any) {
            console.error('Error al registrar compra:', e);
            const status = e?.response?.status;
            if (status === 401) {
                Alert.alert('Sesión expirada', 'Vuelve a iniciar sesión para continuar.', [
                    {
                        text: 'Aceptar',
                        onPress: async () => {
                            try {
                                await logout();
                            } catch { }
                            router.replace('/auth/login');
                        },
                    },
                ]);
            } else {
                Alert.alert('Error', e.message || 'No se pudo registrar la compra');
            }
        } finally {
            setEnviando(false);
        }
    }

    function verDetalle(compra: CompraListado) {
        setCompraSeleccionada(compra);
        setModalDetalle(true);
    }

    return (
        <ProtectedRoute>
            <Container>
                <Header height={120}>
                    <HeaderTitle>Gestión de Compras</HeaderTitle>
                    <HeaderSubtitle>Registrar compras de proveedores y consultar historial</HeaderSubtitle>
                </Header>

                <ScrollView
                    contentContainerStyle={{ paddingBottom: 40 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargarCompras(); }} />
                    }
                >
                    {/* Formulario de registro */}
                    <Section>
                        <SectionTitle>Registrar compra</SectionTitle>

                        <Label>Proveedor *</Label>
                        <Input
                            value={proveedor}
                            onChangeText={setProveedor}
                            placeholder="Nombre del proveedor"
                            style={{ marginBottom: 12 }}
                        />

                        <Label>Observaciones</Label>
                        <Input
                            value={observaciones}
                            onChangeText={setObservaciones}
                            placeholder="Factura, OC, notas..."
                            multiline
                            numberOfLines={2}
                            style={{ marginBottom: 16, minHeight: 60 }}
                        />

                        {/* Items */}
                        <Label>Productos ({items.length})</Label>
                        {items.map((it, idx) => (
                            <ItemCard key={it.id}>
                                <View style={{ marginBottom: 8 }}>
                                    <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Producto #{idx + 1}</Text>
                                    <Input
                                        value={it.nombre || ''}
                                        onChangeText={(txt) => editarItem(it.id!, 'nombre', txt)}
                                        placeholder="Nombre del producto (opcional)"
                                        style={{ marginBottom: 8 }}
                                    />
                                    <Input
                                        value={it.producto_id || ''}
                                        onChangeText={(txt) => editarItem(it.id!, 'producto_id', txt)}
                                        placeholder="ID del producto (opcional)"
                                        style={{ marginBottom: 8 }}
                                    />
                                </View>

                                <Row gap={8} wrap>
                                    <View style={{ flex: 1, minWidth: 120 }}>
                                        <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Cantidad</Text>
                                        <Input
                                            value={String(it.cantidad)}
                                            onChangeText={(txt) => editarItem(it.id!, 'cantidad', Number(txt))}
                                            keyboardType="numeric"
                                            placeholder="1"
                                        />
                                    </View>

                                    <View style={{ flex: 1, minWidth: 120 }}>
                                        <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Precio unit.</Text>
                                        <Input
                                            value={String(it.precio_unitario)}
                                            onChangeText={(txt) => editarItem(it.id!, 'precio_unitario', Number(txt))}
                                            keyboardType="numeric"
                                            placeholder="0.00"
                                        />
                                    </View>
                                </Row>

                                <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb' }}>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f2937', marginBottom: 8 }}>
                                        Subtotal: ${((Number(it.cantidad) || 0) * (Number(it.precio_unitario) || 0)).toFixed(2)}
                                    </Text>
                                    <Row gap={8}>
                                        <Button variant="danger" onPress={() => eliminarItem(it.id!)} style={{ flex: 1 }}>
                                            <ButtonText>🗑️ Eliminar</ButtonText>
                                        </Button>
                                        {idx === items.length - 1 && (
                                            <Button variant="secondary" onPress={agregarItem} style={{ flex: 1 }}>
                                                <ButtonText>➕ Agregar</ButtonText>
                                            </Button>
                                        )}
                                    </Row>
                                </View>
                            </ItemCard>
                        ))}

                        {/* Total y botón de guardar */}
                        <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 2, borderTopColor: '#e5e7eb' }}>
                            <Text style={{ fontSize: 20, fontWeight: '700', color: '#1f2937', marginBottom: 12 }}>
                                Total: ${totalCompra().toFixed(2)}
                            </Text>
                            <Button variant="success" onPress={registrarCompra} disabled={enviando}>
                                {enviando ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <ButtonText>✅ Registrar compra</ButtonText>
                                )}
                            </Button>
                        </View>
                    </Section>

                    {/* Listado de compras */}
                    <Section>
                        <Row style={{ justifyContent: 'space-between', marginBottom: 12 }}>
                            <SectionTitle>Compras recientes</SectionTitle>
                            <TouchableOpacity onPress={cargarCompras} disabled={cargandoCompras}>
                                <Text style={{ color: '#667eea', fontSize: 14, fontWeight: '600' }}>
                                    {cargandoCompras ? 'Actualizando...' : 'Actualizar'}
                                </Text>
                            </TouchableOpacity>
                        </Row>

                        {cargandoCompras && compras.length === 0 ? (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <ActivityIndicator color="#667eea" size="large" />
                                <Text style={{ marginTop: 8, color: '#6b7280' }}>Cargando compras...</Text>
                            </View>
                        ) : compras.length === 0 ? (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <Text style={{ color: '#6b7280' }}>No hay compras registradas</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={compras}
                                keyExtractor={(item) => item.id}
                                scrollEnabled={false}
                                renderItem={({ item }) => (
                                    <CompraCard>
                                        <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 4 }}>
                                                    {item.proveedor}
                                                </Text>
                                                <Text style={{ fontSize: 12, color: '#6b7280' }}>
                                                    {new Date(item.fecha).toLocaleString('es-AR')}
                                                </Text>
                                            </View>
                                            <Badge>
                                                <BadgeText>{item.compra_items?.length || 0} ítems</BadgeText>
                                            </Badge>
                                        </Row>

                                        {item.observaciones ? (
                                            <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 8, fontStyle: 'italic' }}>
                                                📝 {item.observaciones}
                                            </Text>
                                        ) : null}

                                        <TouchableOpacity onPress={() => verDetalle(item)}>
                                            <Text style={{ color: '#667eea', fontSize: 14, fontWeight: '600' }}>Ver detalle →</Text>
                                        </TouchableOpacity>
                                    </CompraCard>
                                )}
                            />
                        )}
                    </Section>
                </ScrollView>

                {/* Modal de detalle */}
                <Modal visible={modalDetalle} animationType="slide" transparent onRequestClose={() => setModalDetalle(false)}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' }}>
                            <LinearGradient
                                colors={['#667eea', '#764ba2']}
                                style={{ padding: 16, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
                            >
                                <Row style={{ justifyContent: 'space-between' }}>
                                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>Detalle de compra</Text>
                                    <TouchableOpacity onPress={() => setModalDetalle(false)}>
                                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>✕ Cerrar</Text>
                                    </TouchableOpacity>
                                </Row>
                            </LinearGradient>

                            {compraSeleccionada && (
                                <ScrollView style={{ padding: 16 }}>
                                    <Label>Proveedor</Label>
                                    <Text style={{ fontSize: 16, color: '#1f2937', marginBottom: 12 }}>{compraSeleccionada.proveedor}</Text>

                                    <Label>Fecha</Label>
                                    <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 12 }}>
                                        {new Date(compraSeleccionada.fecha).toLocaleString('es-AR')}
                                    </Text>

                                    {compraSeleccionada.observaciones ? (
                                        <>
                                            <Label>Observaciones</Label>
                                            <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 12 }}>
                                                {compraSeleccionada.observaciones}
                                            </Text>
                                        </>
                                    ) : null}

                                    <Label>Productos ({compraSeleccionada.compra_items?.length || 0})</Label>
                                    {(compraSeleccionada.compra_items || []).map((it, idx) => (
                                        <ItemCard key={idx}>
                                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f2937', marginBottom: 4 }}>
                                                {it.productos?.nombre || it.producto_id || `Producto ${idx + 1}`}
                                            </Text>
                                            <Row gap={16}>
                                                <Text style={{ fontSize: 13, color: '#6b7280' }}>Cant: {it.cantidad}</Text>
                                                <Text style={{ fontSize: 13, color: '#6b7280' }}>
                                                    Precio: ${Number(it.precio_unitario).toFixed(2)}
                                                </Text>
                                                <Text style={{ fontSize: 13, fontWeight: '600', color: '#1f2937' }}>
                                                    Subtotal: ${(it.cantidad * Number(it.precio_unitario)).toFixed(2)}
                                                </Text>
                                            </Row>
                                        </ItemCard>
                                    ))}

                                    <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 2, borderTopColor: '#e5e7eb' }}>
                                        <Text style={{ fontSize: 18, fontWeight: '700', color: '#1f2937' }}>
                                            Total: ${(compraSeleccionada.compra_items || []).reduce((acc, it) => acc + it.cantidad * Number(it.precio_unitario), 0).toFixed(2)}
                                        </Text>
                                    </View>
                                </ScrollView>
                            )}
                        </View>
                    </View>
                </Modal>
            </Container>
        </ProtectedRoute>
    );
}

export default ComprasScreen;
