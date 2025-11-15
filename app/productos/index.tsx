import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Platform, Switch, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import styled from 'styled-components/native';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';
import { actualizarDescripcionCatalogo, productService } from '../../services/catalogoService';
import { Categoria, categoriasService } from '../../services/categoriasService';
import { calcularPrecioFinal, calcularPrecioTemporal, ProductoAdmin, productosService, STOCK_CRITICO } from '../../services/productosService';
import { safeAsyncStorage } from '../../services/storageUtils';

type GrupoCategoria = { categoriaId: string; categoriaNombre: string; items: ProductoAdmin[] };

// Paleta coherente con la app móvil
const COLORS = {
  primary: '#667eea',
  headerText: '#ffffff',
  successBg: '#c8e6c9',
  successText: '#2e7d32',
  warningBg: '#FECA57',
  warningText: '#784212',
  inactiveBg: '#e0e0e0',
  inactiveText: '#555',
};

const Toolbar = styled.View`
  padding: 12px;
  background-color: #f5f5f5;
  border-bottom-width: 1px;
  border-bottom-color: #e5e5e5;
`;

const Chip = styled.TouchableOpacity`
  padding: 8px 12px;
  border-radius: 16px;
  background-color: #e0e0e0;
  margin-right: 8px;
`;

const Card = styled.View`
  background-color: #fff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  shadow-color: #000;
  shadow-opacity: 0.08;
  shadow-radius: 4px;
  elevation: 2;
`;

export default function ProductosScreen() {
  const router = useRouter();
  const { logout, token } = useAuth();
  const [productos, setProductos] = useState<ProductoAdmin[]>([]);
  const [productosFiltrados, setProductosFiltrados] = useState<ProductoAdmin[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  // Filtros
  const [q, setQ] = useState('');
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [stockMin, setStockMin] = useState<string>('');
  const [stockMax, setStockMax] = useState<string>('');
  const [priceMin, setPriceMin] = useState<string>('');
  const [priceMax, setPriceMax] = useState<string>('');
  const [soloCritico, setSoloCritico] = useState(false);
  // Porcentaje global para cálculo de precio
  const [porcentajeGlobal, setPorcentajeGlobal] = useState<string>('');

  // Agrupación y colapso
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Edición
  const [porcentajesTemp, setPorcentajesTemp] = useState<Record<string, number>>({});
  const porcentajeTimers = useRef<Record<string, any>>({});
  const [isUpdatingPorcentaje, setIsUpdatingPorcentaje] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [productoEdit, setProductoEdit] = useState<ProductoAdmin | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const { width } = useWindowDimensions();
  const isMobile = width < 640 || Platform.OS !== 'web';

  const cargarDatos = async () => {
    try {
      setLoadingCategorias(true);
      const [cats, prods] = await Promise.all([
        categoriasService.obtenerTodas().catch((e) => { console.error('Categorias error:', e); return []; }),
        showInactive ? productosService.listarInactivos() : productosService.listarActivos(),
      ]);
      setCategorias(cats);
      setProductos(prods);
    } catch (e: any) {
      console.error('Error cargando datos de productos:', e);
    } finally { setLoadingCategorias(false); }
  };

  useEffect(() => { cargarDatos(); }, [showInactive]);

  // Aplicar filtros
  useEffect(() => {
    const qLower = q.trim().toLowerCase();
    const minStock = Number(stockMin) || -Infinity;
    const maxStock = Number(stockMax) || Infinity;
    const minPrice = Number(priceMin) || -Infinity;
    const maxPrice = Number(priceMax) || Infinity;

    const pctGlobalNum = Number(porcentajeGlobal);
    const tieneGlobal = porcentajeGlobal.trim() !== '' && !Number.isNaN(pctGlobalNum);
    const base = Array.isArray(productos) ? productos : [];
    const filtrados = base.filter(p => {
      const nombre = p.nombre?.toLowerCase() || '';
      const sku = p.sku?.toLowerCase() || '';
      const byQ = qLower ? (nombre.includes(qLower) || sku.includes(qLower)) : true;
      const byCat = categoriaId ? p.categoria_id === categoriaId : true;
      const stock = Number(p.stock ?? 0);
      const byStock = stock >= minStock && stock <= maxStock;
      const precioFinal = tieneGlobal ? calcularPrecioTemporal(p, pctGlobalNum) : calcularPrecioFinal(p);
      const byPrice = precioFinal >= minPrice && precioFinal <= maxPrice;
      const byCritico = soloCritico ? stock <= STOCK_CRITICO : true;
      return byQ && byCat && byStock && byPrice && byCritico;
    });
    setProductosFiltrados(filtrados);
  }, [q, categoriaId, stockMin, stockMax, priceMin, priceMax, soloCritico, productos, porcentajeGlobal]);

  const grupos = useMemo<GrupoCategoria[]>(() => {
    const map: Record<string, GrupoCategoria> = {};
    for (const p of productosFiltrados) {
      const cid = p.categoria_id ? String(p.categoria_id) : 'sin-categoria';
      const found = categorias.find(c => String(c.id) === cid);
      const nombreCat = found?.nombre || 'Sin categoría';
      if (!map[cid]) map[cid] = { categoriaId: cid, categoriaNombre: nombreCat, items: [] };
      map[cid].items.push(p);
    }
    return Object.values(map).sort((a, b) => a.categoriaNombre.localeCompare(b.categoriaNombre));
  }, [productosFiltrados, categorias]);

  const abrirModalEditar = (p: ProductoAdmin) => {
    setProductoEdit(p);
    setEditNombre(p.nombre || '');
    setEditDescripcion(p.descripcion || '');
    setModalOpen(true);
  };

  const limpiarFiltros = () => {
    setQ('');
    setCategoriaId(null);
    setStockMin('');
    setStockMax('');
    setPriceMin('');
    setPriceMax('');
    setSoloCritico(false);
  };

  const guardarEdicion = async () => {
    if (!productoEdit) return;
    try {
      setIsSaving(true);
      setSaveError(null);
      // Actualización optimista antes del PUT
      const prevSnapshot = productos;
      console.log('[GuardarEdicion] Iniciando guardado', { id: productoEdit.id, nombre: editNombre, descripcion: editDescripcion });
      setProductos(prev => prev.map(p => p.id === productoEdit.id ? { ...p, nombre: editNombre, descripcion: editDescripcion } : p));

      // Usar PATCH catálogo (JSON) para nombre/descripcion; envía Authorization explícito
      await actualizarDescripcionCatalogo(
        productoEdit.id,
        { nombre: editNombre, descripcion: editDescripcion },
        { token: token || undefined }
      );

      console.log('[GuardarEdicion] Guardado exitoso');
      setModalOpen(false);
      setProductoEdit(null);
      Alert.alert('Producto actualizado', 'Los cambios se guardaron correctamente.', [{ text: 'OK' }]);
      await cargarDatos();
    } catch (e) {
      const axiosData = (e as any)?.response?.data;
      const axiosStatus = (e as any)?.response?.status;
      console.error('[GuardarEdicion] Error al guardar', { status: axiosStatus, data: axiosData, error: e });
      // Revertir cambios optimistas ante error
      setProductos(prev => prev.map(p => p.id === (productoEdit?.id || '') ? { ...p, nombre: productoEdit?.nombre || p.nombre, descripcion: productoEdit?.descripcion || p.descripcion } : p));
      const status = (e as any)?.response?.status;
      if (status === 401) {
        const token = await safeAsyncStorage.getItem('authToken');
        if (token) {
          Alert.alert('Permisos insuficientes', 'Necesitas rol de administrador para editar productos.', [
            { text: 'Aceptar' }
          ]);
        } else {
          Alert.alert('Sesión expirada', 'Vuelve a iniciar sesión para continuar.', [
            { text: 'Aceptar', onPress: async () => { try { await logout(); } catch {}; router.replace('/auth/login'); } }
          ]);
        }
      } else if (status === 403) {
        Alert.alert('Permisos insuficientes', 'Tu cuenta no tiene acceso para editar productos.', [
          { text: 'Aceptar' }
        ]);
      } else {
        console.error('Error actualizando producto:', e);
        setSaveError('No se pudo actualizar el producto.');
      }
    } finally {
      console.log('[GuardarEdicion] Finalizado');
      setIsSaving(false);
    }
  };

  const handlePorcentajeChange = (id: string, next: number) => {
    const bounded = Math.max(0, Math.min(next, 100));
    setPorcentajesTemp(prev => ({ ...prev, [id]: bounded }));
    if (porcentajeTimers.current[id]) clearTimeout(porcentajeTimers.current[id]);
    porcentajeTimers.current[id] = setTimeout(async () => {
      setIsUpdatingPorcentaje(id);
      try {
        await productosService.actualizarPorcentaje(id, bounded);
        await cargarDatos();
      } catch (e) {
        const status = (e as any)?.response?.status;
        if (status === 401) {
          Alert.alert('Sesión expirada', 'Vuelve a iniciar sesión para continuar.', [
            { text: 'Aceptar', onPress: async () => { try { await logout(); } catch {}; router.replace('/auth/login'); } }
          ]);
        } else {
          console.error('Error actualizando porcentaje:', e);
        }
      } finally {
        setIsUpdatingPorcentaje(null);
      }
    }, 800);
  };

  const handleGenerarPreciosConsumidorFinal = async () => {
    try {
      await productosService.generarPreciosConsumidorFinal();
      await cargarDatos();
    } catch (e) {
      console.error('Error generando precios consumidor final:', e);
    }
  };

  return (
    <ProtectedRoute>
    <View style={{ flex: 1 }}>
      <Toolbar>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>Filtros de Búsqueda</Text>
        {/* Barra superior ordenada */}
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Buscar */}
          <View style={{ marginRight: 12, marginBottom: 8 }}>
            <TextInput
              placeholder="Buscar producto…"
              value={q}
              onChangeText={setQ}
              style={{ width: 260, height: 38, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 10, borderWidth: 1, borderColor: '#ddd' }}
            />
          </View>

          {/* Categoría */}
          {Platform.OS === 'web' ? (
            <View style={{ marginRight: 12, marginBottom: 8 }}>
              {(
                // Web select para mejor orden visual
                <select
                  value={categoriaId ?? 'all'}
                  onChange={(e: any) => {
                    const val = e.target.value;
                    setCategoriaId(val === 'all' ? null : val);
                  }}
                  style={{ width: 260, height: 38, borderRadius: 8, border: '1px solid #ddd', padding: '8px 10px', background: '#fff', color: '#333' }}
                >
                  <option value="all">Todas las categorías</option>
                  {categorias.map(c => (
                    <option key={c.id} value={String(c.id)}>{c.nombre}</option>
                  ))}
                </select>
              )}
              {loadingCategorias && (
                <Text style={{ marginTop: 4, color: '#666' }}>Cargando categorías…</Text>
              )}
            </View>
          ) : (
            <View style={{ marginRight: 12, marginBottom: 8 }}>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={[{ id: 'all', nombre: 'Todas las categorías', activo: true } as any, ...categorias]}
                keyExtractor={(c) => c.id}
                renderItem={({ item }) => {
                  const selected = (categoriaId ?? 'all') === item.id;
                  return (
                    <Chip
                      onPress={() => setCategoriaId(item.id === 'all' ? null : (prev => prev === item.id ? null : item.id))}
                      style={{ backgroundColor: selected ? COLORS.primary : '#e0e0e0' }}
                    >
                      <Text style={{ color: selected ? '#fff' : '#333' }}>{item.nombre}</Text>
                    </Chip>
                  );
                }}
              />
            </View>
          )}

          {/* Stock */}
          <View style={{ marginRight: 12, marginBottom: 8, flexDirection: 'row' }}>
            <TextInput placeholder="Min" value={stockMin} onChangeText={setStockMin} keyboardType="numeric" style={{ width: 120, height: 38, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 10, borderWidth: 1, borderColor: '#ddd', marginRight: 8 }} />
            <TextInput placeholder="Máx" value={stockMax} onChangeText={setStockMax} keyboardType="numeric" style={{ width: 120, height: 38, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 10, borderWidth: 1, borderColor: '#ddd' }} />
          </View>

          {/* Precio Final */}
          <View style={{ marginRight: 12, marginBottom: 8, flexDirection: 'row' }}>
            <TextInput placeholder="Min" value={priceMin} onChangeText={setPriceMin} keyboardType="numeric" style={{ width: 130, height: 38, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 10, borderWidth: 1, borderColor: '#ddd', marginRight: 8 }} />
            <TextInput placeholder="Máx" value={priceMax} onChangeText={setPriceMax} keyboardType="numeric" style={{ width: 130, height: 38, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 10, borderWidth: 1, borderColor: '#ddd' }} />
          </View>

          {/* Solo crítico + Limpiar */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12, marginBottom: 8 }}>
            <Switch value={soloCritico} onValueChange={setSoloCritico} />
            <Text style={{ marginLeft: 6 }}>Solo stock crítico</Text>
          </View>
          <View style={{ marginRight: 12, marginBottom: 8 }}>
            <TouchableOpacity onPress={limpiarFiltros} style={{ backgroundColor: '#eaeaea', height: 38, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
              <Text>🗑️ Limpiar Filtros</Text>
            </TouchableOpacity>
          </View>

          {/* Inactivos toggle */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ marginRight: 8 }}>Inactivos</Text>
            <Switch value={showInactive} onValueChange={setShowInactive} />
          </View>
        </View>

        {/* Línea decorativa */}
        <LinearGradient colors={[COLORS.primary, '#764ba2']} style={{ height: 6, borderRadius: 6, marginTop: 8 }} />

        <View style={{ marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <TouchableOpacity
            onPress={handleGenerarPreciosConsumidorFinal}
            style={{ backgroundColor: '#4caf50', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginRight: 8, minWidth: isMobile ? 44 : 200, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: isMobile ? 12 : 14 }}>{isMobile ? 'Generar' : 'Generar precios consumidor final'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={async () => {
              try {
                setDownloadingExcel(true);
                await productService.downloadCatalogExcel();
              } catch (e) {
                Alert.alert('Error', 'No se pudo descargar el Excel.');
              } finally {
                setDownloadingExcel(false);
              }
            }}
            style={{ backgroundColor: '#607d8b', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginRight: 8, minWidth: isMobile ? 110 : 160, alignItems: 'center' }}
          >
            {downloadingExcel ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={{ color: '#fff' }}>{isMobile ? 'Excel' : 'Descargar Excel'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={async () => {
              try {
                setDownloadingPDF(true);
                await productService.downloadCatalogPDF();
              } catch (e) {
                Alert.alert('Error', 'No se pudo descargar el PDF.');
              } finally {
                setDownloadingPDF(false);
              }
            }}
            style={{ backgroundColor: '#795548', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, minWidth: isMobile ? 110 : 160, alignItems: 'center' }}
          >
            {downloadingPDF ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={{ color: '#fff' }}>{isMobile ? 'PDF' : 'Descargar PDF'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </Toolbar>

      {grupos.length === 0 ? (
        <View style={{ padding: 16 }}>
          <Text style={{ color: '#666' }}>Sin productos para los filtros aplicados.</Text>
        </View>
      ) : (
        <FlatList
          data={grupos}
          keyExtractor={(g) => g.categoriaId}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item: g }) => (
            <View>
              <TouchableOpacity onPress={() => setCollapsed(prev => ({ ...prev, [g.categoriaId]: !prev[g.categoriaId] }))}>
                <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 6 }}>
                  {g.categoriaNombre} {collapsed[g.categoriaId] ? '▸' : '▾'}
                </Text>
              </TouchableOpacity>
              {!collapsed[g.categoriaId] && (
                <View>
                  {/* Encabezado de columnas */}
                  <View style={{ flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 8, backgroundColor: COLORS.primary, borderRadius: 8, marginBottom: 8 }}>
                    <Text style={{ flex: 2, fontWeight: '600', color: COLORS.headerText }}>Producto</Text>
                    <Text style={{ width: 80, fontWeight: '600', color: COLORS.headerText, textAlign: 'center' }}>Stock</Text>
                    <Text style={{ width: 120, fontWeight: '600', color: COLORS.headerText, textAlign: 'right' }}>Precio costo</Text>
                    <Text style={{ width: 160, fontWeight: '600', color: COLORS.headerText }}>% Ganancia</Text>
                    <Text style={{ width: 140, fontWeight: '600', color: COLORS.headerText, textAlign: 'right' }}>Precio final</Text>
                    <Text style={{ width: 100, fontWeight: '600', color: COLORS.headerText, textAlign: 'center' }}>Estado</Text>
                    <Text style={{ width: 120, fontWeight: '600', color: COLORS.headerText }}>Acciones</Text>
                  </View>
                  {g.items.map(p => (
                    <Card key={p.id}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {/* Producto */}
                        <View style={{ flex: 2, paddingRight: 8 }}>
                          <Text style={{ fontWeight: '600' }}>{p.nombre}</Text>
                          <Text style={{ color: '#666' }}>SKU: {p.sku || '-'}</Text>
                        </View>

                        {/* Stock */}
                        <View style={{ width: 80, alignItems: 'center' }}>
                          {(() => {
                            const critico = (p.stock ?? 0) <= STOCK_CRITICO;
                            const bg = critico ? COLORS.warningBg : COLORS.successBg;
                            const fg = critico ? COLORS.warningText : COLORS.successText;
                            return (
                              <View style={{ paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12, backgroundColor: bg }}>
                                <Text style={{ color: fg }}>{p.stock ?? 0}</Text>
                              </View>
                            );
                          })()}
                        </View>

                        {/* Precio costo */}
                        <View style={{ width: 120, marginRight: 12 }}>
                          <Text style={{ textAlign: 'right' }}>{p.precio_costo ? `$ ${Number(p.precio_costo).toFixed(3)}` : '-'}</Text>
                        </View>

                        {/* % Ganancia */}
                        <View style={{ width: 160, marginLeft: 12 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TextInput
                              value={String(porcentajesTemp[p.id] ?? p.porcentaje_aplicado ?? 45)}
                              onChangeText={(txt) => handlePorcentajeChange(p.id, Number(txt))}
                              keyboardType="numeric"
                              style={{ width: 75, backgroundColor: '#fff', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6, borderWidth: 1, borderColor: '#ddd', textAlign: 'right', fontSize: 13 }}
                            />
                            <View style={{ marginLeft: 6 }}>
                              <TouchableOpacity
                                onPress={() => {
                                  const curr = Number(porcentajesTemp[p.id] ?? p.porcentaje_aplicado ?? 45);
                                  const next = Math.min(100, (isNaN(curr) ? 0 : curr) + 1);
                                  handlePorcentajeChange(p.id, next);
                                }}
                                style={{ width: 22, height: 22, backgroundColor: '#eef2ff', borderRadius: 5, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: '#dbe2ff' }}
                              >
                                <Text style={{ color: '#4f46e5', fontSize: 12, lineHeight: 12 }}>▲</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => {
                                  const curr = Number(porcentajesTemp[p.id] ?? p.porcentaje_aplicado ?? 45);
                                  const next = Math.max(0, (isNaN(curr) ? 0 : curr) - 1);
                                  handlePorcentajeChange(p.id, next);
                                }}
                                style={{ width: 22, height: 22, backgroundColor: '#eef2ff', borderRadius: 5, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: '#dbe2ff', marginTop: 4 }}
                              >
                                <Text style={{ color: '#4f46e5', fontSize: 12, lineHeight: 12 }}>▼</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                          {isUpdatingPorcentaje === p.id && (
                            <Text style={{ color: '#0288d1', marginTop: 6 }}>Guardando…</Text>
                          )}
                        </View>

                        {/* Precio final */}
                        <View style={{ width: 140, marginLeft: 12 }}>
                          {(() => {
                            const pctGlobalNum = Number(porcentajeGlobal);
                            const usaGlobal = porcentajeGlobal.trim() !== '' && !Number.isNaN(pctGlobalNum);
                            const base = usaGlobal ? calcularPrecioTemporal(p, pctGlobalNum) : calcularPrecioFinal(p);
                            return (
                              <>
                                <Text style={{ textAlign: 'right' }}>$ {base.toFixed(2)}</Text>
                                {porcentajesTemp[p.id] !== undefined && (
                                  <Text style={{ color: '#0288d1', textAlign: 'right', marginTop: 2 }}>Temp: $ {calcularPrecioTemporal(p, porcentajesTemp[p.id]).toFixed(2)}</Text>
                                )}
                                {usaGlobal && porcentajesTemp[p.id] === undefined && (
                                  <Text style={{ color: '#667eea', textAlign: 'right', marginTop: 2 }}>Global: {pctGlobalNum}%</Text>
                                )}
                              </>
                            );
                          })()}
                        </View>

                        {/* Estado */}
                        <View style={{ width: 100, alignItems: 'center' }}>
                          <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, backgroundColor: p.activo ? COLORS.successBg : COLORS.inactiveBg }}>
                            <Text style={{ color: p.activo ? COLORS.successText : COLORS.inactiveText }}>{p.activo ? 'Activo' : 'Inactivo'}</Text>
                          </View>
                        </View>

                        {/* Acciones */}
                        <View style={{ width: 120, flexDirection: 'row', justifyContent: 'flex-start' }}>
                          <TouchableOpacity onPress={() => abrirModalEditar(p)} style={{ backgroundColor: '#2196f3', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 }}>
                            <Text style={{ color: '#fff' }}>Editar</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </Card>
                  ))}
                </View>
              )}
            </View>
          )}
        />
      )}

      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Editar producto</Text>
            <Text style={{ marginBottom: 4 }}>Nombre</Text>
            <TextInput value={editNombre} onChangeText={setEditNombre} style={{ backgroundColor: '#f9f9f9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8 }} />
            <Text style={{ marginBottom: 4 }}>Descripción</Text>
            <TextInput value={editDescripcion} onChangeText={setEditDescripcion} multiline style={{ backgroundColor: '#f9f9f9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, minHeight: 80 }} />
            {saveError && (
              <Text style={{ color: '#d32f2f', marginTop: 8 }}>{saveError}</Text>
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
              <TouchableOpacity disabled={isSaving} onPress={() => setModalOpen(false)} style={{ paddingVertical: 10, paddingHorizontal: 12, marginRight: 8, opacity: isSaving ? 0.6 : 1 }}>
                <Text>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={isSaving} onPress={guardarEdicion} style={{ backgroundColor: '#4caf50', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, opacity: isSaving ? 0.8 : 1, minWidth: 140, alignItems: 'center' }}>
                {isSaving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Guardar Cambios</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
    </ProtectedRoute>
  );
}