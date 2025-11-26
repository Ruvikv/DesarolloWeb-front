import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import ProtectedRoute from '../../components/ProtectedRoute';
import { usePedidosAdmin } from '../../hooks/usePedidosAdmin';
import { EstadoPedido } from '../../services/pedidosAdminService';

const estadosOrdenados: EstadoPedido[] = ['pendiente', 'confirmado', 'preparando', 'enviado', 'entregado', 'cancelado'];
const MAX_VIDEO_MB = 20;
const MAX_VIDEO_BYTES = MAX_VIDEO_MB * 1024 * 1024;

// Tokens de diseño para tipografías, espaciados y colores
const ui = {
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
  radius: { sm: 8, md: 12, pill: 999 },
  color: {
    cardBg: '#fff',
    border: '#e6e6e6',
    text: '#1f2937',
    muted: '#6b7280',
    softBg: '#fafafa',
  },
  shadow: { color: '#000', opacity: 0.06, radius: 10, offset: { width: 0, height: 3 }, elevation: 3 },
  type: {
    title: { fontSize: 16, fontWeight: '700' as const },
    meta: { fontSize: 12, color: '#555' },
    label: { fontSize: 13, color: '#444', fontWeight: '600' as const },
    value: { fontSize: 14, fontWeight: '700' as const },
  },
};

export default function AtenderPedidosScreen() {
  const { pedidos, loading, error, actualizandoId, actualizarEstado, actualizarEstadoConVideo } = usePedidosAdmin();
  // En web, almacenar el File directamente para que FormData lo envíe correctamente
  const [videoMap, setVideoMap] = useState<Record<string, File | undefined>>({});
  const [videoErrorMap, setVideoErrorMap] = useState<Record<string, string | undefined>>({});
  const [entregaManualMap, setEntregaManualMap] = useState<Record<string, boolean>>({});
  const [noGuardarVideoMap, setNoGuardarVideoMap] = useState<Record<string, boolean>>({});
  const [mensajeBackendMap, setMensajeBackendMap] = useState<Record<string, string | undefined>>({});
  const [hoverChipMap, setHoverChipMap] = useState<Record<string, boolean>>({});

  // Utilidad: formato de moneda y cálculo de total
  const formatCurrency = (value: number | undefined) => {
    if (typeof value !== 'number') return '$0';
    try {
      return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 }).format(value);
    } catch {
      return `$${value.toFixed(2)}`;
    }
  };

  const computeTotal = (p: any) => {
    const directo: number | undefined = p.total ?? p.total_calculado;
    if (typeof directo === 'number') return directo;
    const items = Array.isArray(p.pedido_items) ? p.pedido_items : [];
    const sum = items.reduce((acc: number, it: any) => acc + (Number(it?.cantidad || 0) * Number(it?.precio_unitario || 0)), 0);
    return sum;
  };

  // Colores por estado
  const estadoColorMap: Record<EstadoPedido, { base: string; selectedBg: string; border: string; text: string }> = {
    pendiente:  { base: '#f2f2f2', selectedBg: '#e9e9e9', border: '#bdbdbd', text: '#616161' },
    confirmado: { base: '#e6f0ff', selectedBg: '#d6e6ff', border: '#1e88e5', text: '#1565c0' },
    preparando: { base: '#fff3e0', selectedBg: '#ffe0b2', border: '#fb8c00', text: '#ef6c00' },
    enviado:    { base: '#f3e5f5', selectedBg: '#e1bee7', border: '#7b1fa2', text: '#6a1b9a' },
    entregado:  { base: '#e8f5e9', selectedBg: '#c8e6c9', border: '#2e7d32', text: '#1b5e20' },
    cancelado:  { base: '#ffebee', selectedBg: '#ffcdd2', border: '#c62828', text: '#b71c1c' },
  };

  // Iconos simples por estado (compatibles con RN y web)
  const estadoIconMap: Record<EstadoPedido, string> = {
    pendiente: '⏳',
    confirmado: '✔️',
    preparando: '🍳',
    enviado: '🚚',
    entregado: '✅',
    cancelado: '✖️',
  };

  const pedidosOrdenados = useMemo(() => {
    return [...pedidos].sort((a, b) => {
      const ia = estadosOrdenados.indexOf(a.estado);
      const ib = estadosOrdenados.indexOf(b.estado);
      return ia - ib;
    });
  }, [pedidos]);

  const handleFileChangeWeb = (id: string, e: any) => {
    const file: File | undefined = e?.target?.files?.[0];
    // Si se des-selecciona, limpiar estado
    if (!file) {
      setVideoMap((prev) => ({ ...prev, [id]: undefined }));
      setVideoErrorMap((prev) => ({ ...prev, [id]: undefined }));
      return;
    }

    // Validación de tamaño máximo
    if (typeof file.size === 'number' && file.size > MAX_VIDEO_BYTES) {
      setVideoMap((prev) => ({ ...prev, [id]: undefined }));
      setVideoErrorMap((prev) => ({ ...prev, [id]: `El video supera ${MAX_VIDEO_MB} MB; no se adjuntará. Comprime el archivo o elige uno más pequeño.` }));
      Alert.alert('Archivo demasiado grande', `El video seleccionado supera ${MAX_VIDEO_MB} MB.`);
      return;
    }

    // Archivo válido
    setVideoMap((prev) => ({ ...prev, [id]: file }));
    setVideoErrorMap((prev) => ({ ...prev, [id]: undefined }));
  };

  return (
    <ProtectedRoute>
      <View style={{ flex: 1, padding: ui.space.lg }}>
        <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: ui.space.md }}>Atender pedidos</Text>

        {loading && (
          <View style={{ paddingVertical: 24 }}>
            <ActivityIndicator />
            <Text style={{ marginTop: 8 }}>Cargando pedidos...</Text>
          </View>
        )}

        {error && (
          <View style={{ paddingVertical: 12 }}>
            <Text style={{ color: 'red' }}>{error}</Text>
          </View>
        )}

        {!loading && pedidosOrdenados.length === 0 && (
          <Text>No hay pedidos para atender.</Text>
        )}

        <ScrollView>
          {pedidosOrdenados.map((p) => {
            const colors = estadoColorMap[p.estado];
            return (
            <View key={p.id} style={{ borderWidth: 1, borderColor: ui.color.border, borderRadius: ui.radius.md, padding: ui.space.md, marginBottom: ui.space.md, backgroundColor: ui.color.cardBg, shadowColor: ui.shadow.color, shadowOpacity: ui.shadow.opacity, shadowRadius: ui.shadow.radius, shadowOffset: ui.shadow.offset, elevation: ui.shadow.elevation }}>
              <View style={{ height: 4, backgroundColor: colors.border, borderTopLeftRadius: ui.radius.md, borderTopRightRadius: ui.radius.md, marginHorizontal: -ui.space.md, marginTop: -ui.space.md }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                {/* Título con separador azul para el número de pedido (responsivo) */}
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
                  <Text style={ui.type.title}>Pedido</Text>
                  <View style={{
                    marginLeft: 6,
                    paddingVertical: 2,
                    paddingHorizontal: 8,
                    borderRadius: ui.radius.pill,
                    backgroundColor: '#667eea',
                    flexShrink: 1,
                  }}>
                    <Text numberOfLines={1} style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>#{p.id}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[ui.type.meta, { marginRight: ui.space.sm }]}>{new Date(p.fecha).toLocaleString()}</Text>
                  <View style={{ paddingVertical: 4, paddingHorizontal: 10, backgroundColor: colors.selectedBg, borderRadius: ui.radius.pill, borderWidth: 1, borderColor: colors.border }}>
                    <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12 }}>{p.estado}</Text>
                  </View>
                </View>
              </View>
              <View style={{ height: 1, backgroundColor: ui.color.border, opacity: 0.6, marginVertical: ui.space.sm }} />
              <Text style={[ui.type.label, { color: ui.color.muted }]}>Cliente: {p.observaciones?.nombre || '—'} • Email: {p.observaciones?.email || '—'}</Text>
              <Text style={[ui.type.value, { marginTop: 2 }]}>Total: {formatCurrency(computeTotal(p))}</Text>
              <Text style={[ui.type.meta, { marginTop: 2 }]}>Ítems: {Array.isArray(p.pedido_items) ? p.pedido_items.length : 0}</Text>

              <View style={{ marginTop: ui.space.md }}>
                <Text style={[ui.type.label, { marginBottom: ui.space.sm }]}>Acciones de estado</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {estadosOrdenados.map((estado) => {
                    const keyChip = `${p.id}-${estado}`;
                    const hovered = hoverChipMap[keyChip] || false;
                    const selected = p.estado === estado;
                    const bg = selected || hovered ? estadoColorMap[estado].selectedBg : estadoColorMap[estado].base;
                    const br = selected || hovered ? estadoColorMap[estado].border : ui.color.border;
                    return (
                    <Pressable
                      key={estado}
                      onHoverIn={() => setHoverChipMap(prev => ({ ...prev, [keyChip]: true }))}
                      onHoverOut={() => setHoverChipMap(prev => ({ ...prev, [keyChip]: false }))}
                      style={({ pressed }) => ({ paddingVertical: 6, paddingHorizontal: 12, borderRadius: ui.radius.pill, borderWidth: 1, marginRight: ui.space.sm, marginBottom: ui.space.sm, backgroundColor: bg, borderColor: br, ...(pressed ? { transform: [{ scale: 0.98 }] } : {}), ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}) })}
                      onPress={async () => {
                        // Para garantizar el envío de correo, usar siempre PUT en 'enviado' (video opcional)
                        if (estado === 'enviado') {
                          const noGuardar = noGuardarVideoMap[p.id] ?? true;
                          // limpiar mensaje previo
                          setMensajeBackendMap(prev => ({ ...prev, [p.id]: undefined }));
                          const res = await actualizarEstadoConVideo(p.id, 'enviado', videoMap[p.id], noGuardar);
                          if (res?.success) {
                            const mensaje = res?.data?.message || 'Correo enviado';
                            setMensajeBackendMap(prev => ({ ...prev, [p.id]: mensaje }));
                            Alert.alert('Éxito', mensaje);
                          } else if (res && !res.success) {
                            Alert.alert('Error', res.message ?? 'No se pudo actualizar el pedido');
                          }
                        } else {
                          const entregaManual = entregaManualMap[p.id] || false;
                          const res = await actualizarEstado(p.id, estado, entregaManual);
                          if (res && !res.success) {
                            Alert.alert('Error', res.message ?? 'No se pudo actualizar el pedido');
                          }
                        }
                      }}
                      disabled={actualizandoId === p.id}
                    >
                      <Text style={{ color: estadoColorMap[estado].text, fontWeight: selected || hovered ? '700' : '500' }}>{estadoIconMap[estado]} {estado}</Text>
                    </Pressable>
                  )})}
                </View>
              </View>

              {Platform.OS === 'web' && (
                <View style={{ marginTop: ui.space.md, padding: ui.space.md, borderWidth: 1, borderColor: ui.color.border, borderRadius: ui.radius.sm, backgroundColor: ui.color.softBg }}>
                  <Text style={[ui.type.label, { marginBottom: ui.space.xs }]}>Evidencia de envío (opcional, video):</Text>
                  {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
                  {/* @ts-ignore - elemento web */}
                  <input type="file" accept="video/*" onChange={(e) => handleFileChangeWeb(p.id, e)} />
                  <Text style={[ui.type.meta, { marginTop: ui.space.xs }]}>Tamaño máximo permitido: {MAX_VIDEO_MB} MB</Text>
                  {videoMap[p.id] && <Text style={{ marginTop: ui.space.xs }}>Seleccionado: {videoMap[p.id]?.name}</Text>}
                  {videoErrorMap[p.id] && (
                    <Text style={{ marginTop: ui.space.xs, color: 'red' }}>{videoErrorMap[p.id]}</Text>
                  )}
                  <View style={{ marginTop: ui.space.sm }}>
                    <TouchableOpacity
                      style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: ui.radius.sm, backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#ddd' }}
                      onPress={() => setNoGuardarVideoMap((prev) => ({ ...prev, [p.id]: !(prev[p.id] ?? true) }))}
                    >
                      <Text>No guardar video en BD: {(noGuardarVideoMap[p.id] ?? true) ? 'Sí' : 'No'}</Text>
                    </TouchableOpacity>
                    <Text style={[ui.type.meta, { marginTop: ui.space.xs }]}>Si está activo, el correo enviará el enlace público al video sin guardar ruta en la BD.</Text>
                  </View>
                </View>
              )}

              <View style={{ marginTop: ui.space.sm }}>
                <TouchableOpacity
                  style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: ui.radius.sm, backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#ddd' }}
                  onPress={() => setEntregaManualMap((prev) => ({ ...prev, [p.id]: !prev[p.id] }))}
                >
                  <Text>Entrega manual: {entregaManualMap[p.id] ? 'Sí' : 'No'}</Text>
                </TouchableOpacity>
              </View>

              {actualizandoId === p.id && (
                <View style={{ marginTop: ui.space.sm, flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator size="small" />
                  <Text style={[ui.type.meta, { marginLeft: ui.space.xs }]}>Actualizando...</Text>
                </View>
              )}

              {mensajeBackendMap[p.id] && (
                <View style={{ marginTop: 8 }}>
                  <Text style={{ color: '#2e7d32', fontWeight: '600' }}>Mensaje del backend: {mensajeBackendMap[p.id]}</Text>
                </View>
              )}
            </View>
          )})}
        </ScrollView>
      </View>
    </ProtectedRoute>
  );
}
