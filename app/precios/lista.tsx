import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, Alert, TouchableOpacity, ScrollView, Image, TextInput, Modal, Platform, useWindowDimensions } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useRouter } from 'expo-router';
import { apiService } from '../../services/apiService';
import { preciosService, AjusteGlobal } from '../../services/preciosService';
import { Ionicons } from '@expo/vector-icons';
import { barcodeService, BarcodeProduct } from '../../services/barcodeService';
import { productosService } from '../../services/productosService';
import { categoriasService, Categoria as CategoriaItem } from '../../services/categoriasService';
import { API_CONFIG } from '../../config/api.js';

type Ajuste = { valor: number } | null;
type ProductoCF = any; // estructura flexible: usamos campos comunes
type PrecioMayorista = any; // estructura flexible

export default function ListaPreciosScreen() {
  const { width } = useWindowDimensions();
  const isMobile = (Platform.OS !== 'web') || width < 640;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [ajuste, setAjuste] = useState<AjusteGlobal>(null);
  const [consumidorFinal, setConsumidorFinal] = useState<ProductoCF[]>([]);
  const [mayoristas, setMayoristas] = useState<PrecioMayorista[]>([]);
  const [search, setSearch] = useState('');
  const [scannerVisible, setScannerVisible] = useState(false);
  const [ajusteValor, setAjusteValor] = useState<string>('');
  const [savingAjuste, setSavingAjuste] = useState<boolean>(false);
  const [quickCreateVisible, setQuickCreateVisible] = useState(false);
  const [scanInfo, setScanInfo] = useState<BarcodeProduct | null>(null);
  const [precioRapido, setPrecioRapido] = useState<string>('');
  const [ajusteNotice, setAjusteNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estado para edición en modal
  const [editVisible, setEditVisible] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState<string>('');
  const [editSku, setEditSku] = useState<string>('');
  const [editPrecioCosto, setEditPrecioCosto] = useState<string>('');
  const [editStock, setEditStock] = useState<string>('');
  const [editCategoria, setEditCategoria] = useState<string>('');
  const [editDescripcion, setEditDescripcion] = useState<string>('');
  const [categorias, setCategorias] = useState<CategoriaItem[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState<boolean>(false);
  const [categoriaOpen, setCategoriaOpen] = useState<boolean>(false);
  const [editImagenes, setEditImagenes] = useState<File[]>([]);

  // Estado y refs para lector en Web (fallback sin expo-barcode-scanner)
  const [webDetectorAvailable, setWebDetectorAvailable] = useState<boolean>(false);
  const [webCameraCapable, setWebCameraCapable] = useState<boolean>(false);
  const [webCameraActive, setWebCameraActive] = useState<boolean>(false);
  const [webScannerError, setWebScannerError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState<string>('');
  const videoRef = React.useRef<any>(null);
  const zxingReaderRef = React.useRef<any>(null);
  const [scannerPermission, setScannerPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [ajusteRes, cfRes, mayRes] = await Promise.all([
        preciosService.getAjustePrecioCosto(),
        preciosService.obtenerProductosConGanancia(),
        preciosService.obtenerPreciosMayoristas(),
      ]);

      setAjuste(ajusteRes ?? null);
      const pct = (ajusteRes as any)?.valor;
      setAjusteValor(typeof pct === 'number' ? String(pct) : '');
      setConsumidorFinal(cfRes ?? []);
      setMayoristas(mayRes ?? []);
    } catch (e: any) {
      console.error('Error al cargar lista de precios:', e?.message || e);
      Alert.alert('Error', e?.message || 'No se pudo cargar la lista de precios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Nota: en web usamos exclusivamente el fallback con ZXing/MediaDevices.

  // Detectar disponibilidad de APIs en navegador para fallback web
  useEffect(() => {
    try {
      const hasDetector = typeof window !== 'undefined' && (window as any).BarcodeDetector;
      const hasMedia = typeof navigator !== 'undefined' && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      setWebDetectorAvailable(!!hasDetector);
      setWebCameraCapable(!!hasMedia);
    } catch {
      setWebDetectorAvailable(false);
      setWebCameraCapable(false);
    }
  }, []);

  // En web, el permiso lo gestiona el navegador al invocar getUserMedia.

  const startWebCamera = async () => {
    try {
      setWebScannerError(null);
      // Intentar con distintas restricciones para maximizar compatibilidad
      const candidates: MediaStreamConstraints[] = [
        { video: { facingMode: { ideal: 'environment' } } },
        { video: { facingMode: 'environment' } },
        { video: true },
      ];
      let stream: MediaStream | null = null;
      let lastErr: any = null;
      for (const c of candidates) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(c);
          break;
        } catch (err) {
          lastErr = err;
        }
      }

      // Si no logramos abrir cámara, mostrar mensaje más claro
      if (!stream) {
        const msg = (lastErr && (lastErr as any).message) || 'No se pudo acceder a la cámara';
        setWebScannerError(`${msg}. Verifica permisos del navegador y que haya una cámara disponible.`);
        return;
      }

      const video = videoRef.current;
      if (!video) return;
      try { (video as any).setAttribute?.('playsinline', 'true'); } catch {}
      try { (video as any).muted = true; } catch {}
      video.srcObject = stream;
      await (video as any).play?.();
      setWebCameraActive(true);

      const Detector = (window as any).BarcodeDetector;
      if (Detector) {
        const detector = new Detector({ formats: ['code_128', 'ean_13', 'qr_code', 'ean_8', 'upc_a', 'upc_e'] });
        const loop = async () => {
          if (!webCameraActive || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const raw = (codes && codes[0]?.rawValue) || '';
            if (raw) {
              onBarcodeScannedWeb(String(raw));
              return; // detener al encontrar uno
            }
          } catch (e) {
            // Si falla, seguimos intentando sin bloquear
          }
          requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
      } else {
        // Sin BarcodeDetector nativo, evitamos dependencias web externas para mantener compatibilidad.
        setWebScannerError('Detección no soportada en este navegador. Usa la entrada manual.');
      }
    } catch (e: any) {
      setWebScannerError(e?.message || 'Error al acceder a la cámara');
    }
  };

  const stopWebCamera = () => {
    try {
      if (zxingReaderRef.current) {
        try { zxingReaderRef.current.reset?.(); } catch {}
        zxingReaderRef.current = null;
      }
      const video = videoRef.current;
      const stream: MediaStream | undefined = video?.srcObject as any;
      stream?.getTracks()?.forEach(t => t.stop());
      if (video) video.srcObject = null;
    } catch {}
    setWebCameraActive(false);
  };

  // Asegurar detener cámara cuando se cierra el modal
  useEffect(() => {
    if (!scannerVisible) {
      stopWebCamera();
    }
  }, [scannerVisible]);

  const onBarcodeScannedWeb = (code: string) => {
    const trimmed = String(code || '').trim();
    // No llenar el campo de búsqueda automáticamente al escanear
    (async () => {
      try {
        const found = await barcodeService.buscarProductoGlobal(trimmed);
        if (found) {
          setScanInfo(found);
          setPrecioRapido('');
          setQuickCreateVisible(true);
        }
      } catch {}
    })();
    stopWebCamera();
    setScannerVisible(false);
  };

  // Cargar categorías cuando se abre el modal de edición (una sola vez por apertura)
  useEffect(() => {
    let mounted = true;
    if (editVisible) {
      (async () => {
        try {
          setLoadingCategorias(true);
          const cats = await categoriasService.obtenerTodas();
          if (mounted) setCategorias(cats || []);
        } catch (e) {
          console.warn('No se pudieron cargar categorías', e);
        } finally {
          if (mounted) setLoadingCategorias(false);
        }
      })();
    } else {
      // Cerrar dropdown al cerrar modal
      setCategoriaOpen(false);
    }
    return () => { mounted = false; };
  }, [editVisible]);

  const renderCFItem = ({ item, index }: { item: any; index: number }) => {
    const nombre = item?.nombre || item?.name || 'Producto';
    const imagen = item?.imagen_principal || item?.imagen || item?.image;
    const imagenUrl = resolveImageUrl(imagen);
    const sku = item?.sku || item?.codigo || item?.codigo_sku;
    const precioCosto = item?.precio_costo ?? item?.costo ?? null;
    const ajustePct = (ajuste as any)?.valor ?? null;
    const ajustado = typeof precioCosto === 'number' && typeof ajustePct === 'number'
      ? precioCosto * (1 + ajustePct / 100)
      : null;
    const stock = item?.stock ?? item?.existencia ?? null;
    const desc = item?.descripcion_corta || item?.descripcion || '';
    const precioFinal = item?.precio_final ?? item?.precios_productos?.[0]?.precio_final ?? item?.price;

    // Filtro de búsqueda por nombre, sku o descripción
    const needle = search.trim().toLowerCase();
    if (needle && !(`${nombre} ${sku ?? ''} ${desc}`.toLowerCase().includes(needle))) {
      return null;
    }

    const onEdit = () => {
      const id = String(item?.id ?? '');
      if (!id) {
        return Alert.alert('Atención', 'No se encontró el ID del producto');
      }
      setEditId(id);
      setEditNombre(item?.nombre || item?.name || '');
      setEditSku(item?.sku || item?.codigo || item?.codigo_sku || '');
      const pc = item?.precio_costo ?? item?.costo;
      setEditPrecioCosto(pc != null ? String(pc) : '');
      const st = item?.stock ?? item?.existencia;
      setEditStock(st != null ? String(st) : '');
      setEditCategoria(item?.categoria || item?.categoria_nombre || '');
      setEditDescripcion(item?.descripcion_corta || item?.descripcion || '');
      setEditVisible(true);
    };
    const onDelete = async () => {
      try {
        if (!item?.id) return Alert.alert('Atención', 'No se encontró el ID del producto');
        Alert.alert('Confirmar', '¿Eliminar este producto?', [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar', style: 'destructive', onPress: async () => {
              try {
                await apiService.delete(`/productos/${item.id}`);
                // Remover localmente y refrescar
                setConsumidorFinal(prev => prev.filter((p: any) => p?.id !== item.id));
              } catch (e: any) {
                Alert.alert('Error', e?.message || 'No se pudo eliminar');
              }
            }
          }
        ]);
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'No se pudo eliminar');
      }
    };

    const even = index % 2 === 0;
    if (isMobile) {
      return (
        <View style={[styles.mobileCard, even && { backgroundColor: '#fafafa' }]}>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ marginRight: 12 }}>
              {imagenUrl ? (
                <Image source={{ uri: imagenUrl }} style={styles.mobileImage} />
              ) : (
                <View style={[styles.mobileImage, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#eee' }]}>
                  <Ionicons name="image-outline" size={20} color="#999" />
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.mobileTitle} numberOfLines={2}>{nombre}</Text>
              <Text style={styles.mobileSub} numberOfLines={1}>{sku || 'SKU: —'}</Text>
              <View style={styles.mobileRow}>
                <Text style={styles.mobileLabel}>Costo:</Text>
                <Text style={styles.mobileValue}>{typeof precioCosto === 'number' ? `$ ${precioCosto.toFixed(2)}` : '—'}</Text>
                <Text style={[styles.mobileLabel, { marginLeft: 8 }]}>Ajustado:</Text>
                <Text style={[styles.mobileValue, { color: '#4f46e5' }]}>{typeof ajustado === 'number' ? `$ ${ajustado.toFixed(2)}` : '—'}</Text>
              </View>
              <View style={styles.mobileRow}>
                <Text style={styles.mobileLabel}>Stock:</Text>
                <Text style={styles.mobileValue}>{typeof stock === 'number' ? String(stock) : '—'}</Text>
              </View>
              {!!desc && (
                <Text style={styles.mobileDesc} numberOfLines={2}>{desc}</Text>
              )}
            </View>
          </View>
          <View style={styles.mobileActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={onEdit}>
              <Ionicons name="create-outline" size={18} color="#667eea" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={onDelete}>
              <Ionicons name="trash-outline" size={18} color="#e53935" />
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return (
      <View style={[styles.row, even && styles.rowEven]}>
        <View style={[styles.cellImage, styles.cellBorder]}>{imagenUrl ? <Image source={{ uri: imagenUrl }} style={styles.image} /> : <View style={styles.imagePlaceholder}><Ionicons name="image-outline" size={20} color="#999" /></View>}</View>
        <Text style={[styles.cellName, styles.cellBorder]} numberOfLines={1}>{nombre}</Text>
        <Text style={[styles.cellSku, styles.cellBorder]}>{sku || '—'}</Text>
        <Text style={[styles.cellMoney, styles.cellBorder]}>{typeof precioCosto === 'number' ? `$ ${precioCosto.toFixed(2)}` : '—'}</Text>
        <Text style={[styles.cellMoneyAccent, styles.cellBorder]}>{typeof ajustado === 'number' ? `$ ${ajustado.toFixed(2)}` : '—'}</Text>
        <Text style={[styles.cellStock, styles.cellBorder]}>{typeof stock === 'number' ? String(stock) : '—'}</Text>
        <Text style={[styles.cellDesc, styles.cellBorder]} numberOfLines={1}>{desc || '—'}</Text>
        <View style={styles.cellActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={onEdit}>
            <Ionicons name="create-outline" size={18} color="#667eea" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={onDelete}>
            <Ionicons name="trash-outline" size={18} color="#e53935" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderMayItem = ({ item, index }: { item: any; index: number }) => {
    const nombre = item?.producto?.nombre || item?.nombre || 'Producto';
    const precio = item?.precio_mayorista ?? item?.precio ?? item?.precio_final;
    const even = index % 2 === 0;
    return (
      <View style={[styles.row, even && styles.rowEven]}>
        <Text style={styles.cellName}>{nombre}</Text>
        <Text style={styles.cellMoney}>{
          typeof precio === 'number' ? `$ ${Number(precio).toFixed(2)}` : '—'
        }</Text>
      </View>
    );
  };

  const guardarAjuste = async () => {
    const parsed = Number(ajusteValor);
    if (!Number.isFinite(parsed)) {
      setAjusteNotice({ type: 'error', text: 'Ingresa un número válido para el ajuste.' });
      setTimeout(() => setAjusteNotice(null), 3000);
      return Alert.alert('Dato inválido', 'Ingresa un número válido para el ajuste.');
    }
    try {
      setSavingAjuste(true);
      // Guardar en backend y actualizar la UI de forma optimista
      await preciosService.actualizarAjustePrecioCosto(parsed);
      setAjuste({ valor: parsed });
      setAjusteValor(String(parsed));
      Alert.alert('OK', 'Ajuste actualizado correctamente.');
      setAjusteNotice({ type: 'success', text: 'Ajuste aplicado correctamente.' });
      setTimeout(() => setAjusteNotice(null), 3000);
      await cargarDatos();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo actualizar el ajuste.');
      setAjusteNotice({ type: 'error', text: e?.message || 'No se pudo actualizar el ajuste.' });
      setTimeout(() => setAjusteNotice(null), 4000);
    } finally {
      setSavingAjuste(false);
    }
  };

  const guardarEdicion = async () => {
    try {
      if (!editId) return Alert.alert('Atención', 'No se pudo determinar el producto a editar');
      const precio = editPrecioCosto.trim() ? Number(editPrecioCosto) : undefined;
      const stock = editStock.trim() ? Number(editStock) : undefined;
      if (precio !== undefined && (!Number.isFinite(precio) || precio < 0)) {
        return Alert.alert('Dato inválido', 'Precio de costo debe ser un número válido');
      }
      if (stock !== undefined && (!Number.isFinite(stock) || stock < 0)) {
        return Alert.alert('Dato inválido', 'Stock debe ser un número válido');
      }
      setSavingEdit(true);
      // Importante: respetar contrato del backend y evitar enviar SKU en edición
      await productosService.actualizarProductoCatalogo(editId, {
        nombre: editNombre,
        precio_costo: precio,
        stock: stock,
        categoria: editCategoria || undefined,
        descripcion: editDescripcion || undefined,
        imagenes: editImagenes.length ? editImagenes : undefined,
      });
      Alert.alert('OK', 'Producto actualizado exitosamente');
      setEditVisible(false);
      setEditId(null);
      setEditImagenes([]);
      await cargarDatos();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo actualizar el producto');
    } finally {
      setSavingEdit(false);
    }
  };

  const crearProductoRapido = async () => {
    try {
      const nombre = scanInfo?.nombre || '';
      const precio = Number(precioRapido);
      if (!nombre) return Alert.alert('Falta nombre', 'No se encontró un nombre para el producto.');
      if (!Number.isFinite(precio) || precio <= 0) return Alert.alert('Dato inválido', 'Ingresa un precio de costo válido.');
      await productosService.crearRapido({ nombre, precio_costo: precio });
      Alert.alert('OK', 'Producto creado rápidamente.');
      setQuickCreateVisible(false);
      setScanInfo(null);
      setPrecioRapido('');
      await cargarDatos();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo crear el producto.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} nestedScrollEnabled>
      <View style={styles.header}>
        <Text style={styles.title}>Lista de Precios</Text>
        <View style={styles.toolbar}>
          <TouchableOpacity style={[styles.refresh, styles.scanBtn, Platform.OS !== 'web' && styles.scanBtnMobile]} onPress={() => setScannerVisible(true)}>
            <Ionicons name="barcode-outline" size={18} color="#fff" />
            {Platform.OS === 'web' ? (
              <Text style={[styles.refreshText, { marginLeft: 6 }]}>Lector de código de barras</Text>
            ) : null}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.refresh, styles.refreshBtn, Platform.OS !== 'web' && styles.scanBtnMobile]} onPress={cargarDatos} disabled={loading}>
            {Platform.OS === 'web' ? (
              <Text style={styles.refreshText}>{loading ? 'Cargando…' : 'Refrescar'}</Text>
            ) : (
              <Ionicons name="refresh-outline" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Obteniendo datos…</Text>
        </View>
      ) : (
        <View>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, styles.sectionTitleChip]}>Ajuste Global de Precio de Costo</Text>
            <Text style={styles.adjustHint}>Este valor (en %) se aplica al precio de costo antes de calcular el precio final.</Text>
          <View style={styles.adjustRow}>
            <TextInput
              placeholder="0"
              value={ajusteValor}
              onChangeText={setAjusteValor}
              keyboardType="numeric"
              style={styles.adjustInput}
              editable={!savingAjuste}
            />
            <Text style={styles.percentMark}>%</Text>
            <TouchableOpacity style={[styles.applyBtn, savingAjuste && { opacity: 0.6 }]} disabled={savingAjuste} onPress={guardarAjuste}>
              <Text style={styles.applyBtnText}>{savingAjuste ? 'Guardando…' : 'Aplicar Ajuste'}</Text>
            </TouchableOpacity>
          </View>
          {ajusteNotice && (
            <View style={[styles.noticeBox, ajusteNotice.type === 'success' ? styles.noticeSuccess : styles.noticeError]}>
              <Ionicons name={ajusteNotice.type === 'success' ? 'checkmark-circle' : 'alert-circle'} size={16} color={ajusteNotice.type === 'success' ? '#2e7d32' : '#c62828'} />
              <Text style={[styles.noticeText, ajusteNotice.type === 'success' ? { color: '#2e7d32' } : { color: '#c62828' }]}>{ajusteNotice.text}</Text>
            </View>
          )}
          </View>

          <View style={[styles.section, { paddingVertical: 8 }]}> 
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="search-outline" size={18} color="#666" />
              <TextInput
                placeholder="Buscar producto…"
                value={search}
                onChangeText={setSearch}
                style={styles.searchInput}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, styles.sectionTitleChip]}>Consumidor Final</Text>
            {isMobile ? (
              <FlatList
                data={consumidorFinal}
                keyExtractor={(_, idx) => `cf-${idx}`}
                renderItem={renderCFItem}
                scrollEnabled={true}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ minWidth: 960 }}>
                <FlatList
                  data={consumidorFinal}
                  keyExtractor={(_, idx) => `cf-${idx}`}
                  renderItem={renderCFItem}
                  scrollEnabled={false}
                  ListHeaderComponent={() => (
                    <View style={[styles.row, styles.headerRow]}>
                      <View style={[styles.cellImageHeader, styles.cellBorder]}><Text style={styles.headerCellText} numberOfLines={1}>Imagen</Text></View>
                      <Text style={[styles.cellName, styles.cellBorder, styles.headerCellText]} numberOfLines={1}>Nombre</Text>
                      <Text style={[styles.cellSku, styles.cellBorder, styles.headerCellText]} numberOfLines={1}>SKU</Text>
                      <Text style={[styles.cellMoney, styles.cellBorder, styles.headerCellText]} numberOfLines={1}>Precio de Costo</Text>
                      <Text style={[styles.cellMoneyAccent, styles.cellBorder, styles.headerCellText, styles.headerAccentCell]} numberOfLines={1}>Costo Ajustado</Text>
                      <Text style={[styles.cellStock, styles.cellBorder, styles.headerCellText]} numberOfLines={1}>Stock</Text>
                      <Text style={[styles.cellDesc, styles.cellBorder, styles.headerCellText]} numberOfLines={1}>Descripción corta</Text>
                      <View style={[styles.cellActions, styles.cellBorder]}><Text style={styles.headerCellText} numberOfLines={1}>Acciones</Text></View>
                    </View>
                  )}
                />
              </ScrollView>
            )}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, styles.sectionTitleChip]}>Mayoristas</Text>
            {isMobile ? (
              <FlatList
                data={mayoristas}
                keyExtractor={(_, idx) => `may-${idx}`}
                renderItem={renderMayItem}
                scrollEnabled={true}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ minWidth: 640 }}>
                <FlatList
                  data={mayoristas}
                  keyExtractor={(_, idx) => `may-${idx}`}
                  renderItem={renderMayItem}
                  scrollEnabled={false}
                />
              </ScrollView>
            )}
          </View>
        </View>
      )}

      {/* Modal de lector de código de barras */}
      <Modal visible={scannerVisible} animationType="slide" onRequestClose={() => setScannerVisible(false)}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <View style={{ padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#667eea' }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Lector de código de barras</Text>
            <TouchableOpacity onPress={() => setScannerVisible(false)}>
              <Ionicons name="close-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          {/* Entrada manual disponible en todos los dispositivos */}
          <View style={{ padding: 12, backgroundColor: '#111', flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="create-outline" size={18} color="#ddd" />
            <TextInput
              placeholder="Ingresar código manual…"
              placeholderTextColor="#888"
              onChangeText={setManualCode}
              value={manualCode}
              style={{ flex: 1, marginLeft: 8, backgroundColor: '#222', color: '#eee', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
            />
            <TouchableOpacity onPress={() => manualCode.trim() && onBarcodeScannedWeb(manualCode.trim())} style={{ marginLeft: 8, backgroundColor: '#667eea', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}>
              <Ionicons name="checkmark-outline" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
          {Platform.OS !== 'web' ? (
            // Scanner nativo con expo-camera en Android/iOS
            cameraPermission?.granted ? (
              <CameraView
                style={{ flex: 1 }}
                facing={'back'}
                barcodeScannerSettings={{
                  barcodeTypes: ['qr', 'ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39']
                }}
                onBarcodeScanned={({ data }: BarcodeScanningResult) => {
                  const code = String(data || '').trim();
                  if (!code) return;
                  onBarcodeScannedWeb(code);
                }}
              />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', marginBottom: 12, textAlign: 'center' }}>
                  Necesitamos permiso de cámara para escanear códigos.
                </Text>
                <TouchableOpacity onPress={() => requestCameraPermission?.()} style={{ backgroundColor: '#4caf50', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 }}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Conceder permiso</Text>
                </TouchableOpacity>
              </View>
            )
          ) : (
            // Fallback web
            <View style={{ flex: 1, padding: 16 }}>
              <View style={{ marginBottom: 14 }}>
                <Text style={{ color: '#fff', fontWeight: '700', marginBottom: 6 }}>Lector web rápido</Text>
                <Text style={{ color: '#ddd' }}>Ingresa un código manualmente o intenta usar la cámara en navegador.</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                  placeholder="Pegar código…"
                  value={manualCode}
                  onChangeText={setManualCode}
                  style={{ flex: 1, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 }}
                />
            <TouchableOpacity
              style={{ marginLeft: 8, backgroundColor: '#667eea', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 }}
              onPress={() => manualCode.trim() && onBarcodeScannedWeb(manualCode.trim())}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Buscar</Text>
            </TouchableOpacity>
              </View>

              {webCameraCapable && !webCameraActive && (
                <View style={{ marginTop: 16 }}>
                  <TouchableOpacity onPress={startWebCamera} style={{ backgroundColor: '#4caf50', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, alignSelf: 'flex-start' }}>
                    <Text style={{ color: '#fff', fontWeight: '700' }}>Usar cámara (beta)</Text>
                  </TouchableOpacity>
                  {!!webScannerError && <Text style={{ color: '#ffcdd2', marginTop: 8 }}>{webScannerError}</Text>}
                </View>
              )}

              {webCameraActive && (
                <View style={{ marginTop: 16 }}>
                  {/** @ts-ignore web-only element */}
                  {React.createElement('video', { ref: (el: any) => (videoRef.current = el), style: { width: '100%', maxWidth: 640, height: 360, backgroundColor: '#000', borderRadius: 8 } })}
                  <View style={{ flexDirection: 'row', marginTop: 8 }}>
                    <TouchableOpacity onPress={stopWebCamera} style={{ backgroundColor: '#e53935', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 }}>
                      <Text style={{ color: '#fff', fontWeight: '700' }}>Detener cámara</Text>
                    </TouchableOpacity>
                    {!!webScannerError && <Text style={{ color: '#ffcdd2', marginLeft: 12, alignSelf: 'center' }}>{webScannerError}</Text>}
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </Modal>

      {/* Modal Alta Rápida post-escaneo */}
      <Modal visible={quickCreateVisible} animationType="slide" onRequestClose={() => setQuickCreateVisible(false)}>
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={{ padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' }}>
            <Text style={{ fontWeight: '700' }}>Alta rápida de producto</Text>
            <TouchableOpacity onPress={() => setQuickCreateVisible(false)}>
              <Ionicons name="close-outline" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <View style={{ padding: 16 }}>
            {scanInfo ? (
              <View style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {scanInfo.imagen_url ? (
                    <Image source={{ uri: scanInfo.imagen_url }} style={{ width: 64, height: 64, borderRadius: 8, backgroundColor: '#eee', marginRight: 12 }} />
                  ) : (
                    <View style={{ width: 64, height: 64, borderRadius: 8, backgroundColor: '#eee', marginRight: 12, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="image-outline" size={20} color="#999" />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700' }}>{scanInfo.nombre}</Text>
                    {!!scanInfo.marca && <Text style={{ color: '#666', marginTop: 2 }}>{scanInfo.marca}</Text>}
                    {!!scanInfo.descripcion && <Text style={{ color: '#666', marginTop: 4 }} numberOfLines={2}>{scanInfo.descripcion}</Text>}
                  </View>
                </View>
              </View>
            ) : (
              <Text style={{ color: '#666' }}>No se encontraron datos globales para el código escaneado. Puedes crear el producto manualmente desde la sección de productos.</Text>
            )}
            <View style={{ marginTop: 8 }}>
              <Text style={{ marginBottom: 6 }}>Precio de costo</Text>
              <TextInput
                placeholder="0"
                value={precioRapido}
                onChangeText={setPrecioRapido}
                keyboardType="numeric"
                style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 }}
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <TouchableOpacity onPress={crearProductoRapido} style={{ backgroundColor: '#2e7d32', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Crear rápido</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Edición de Producto */}
      <Modal visible={editVisible} animationType="fade" transparent onRequestClose={() => setEditVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Editar Producto</Text>
              <TouchableOpacity onPress={() => setEditVisible(false)}>
                <Ionicons name="close-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }} style={{ maxHeight: 520 }}>
              <Text style={styles.modalLabel}>Nombre *</Text>
              <TextInput value={editNombre} onChangeText={setEditNombre} style={styles.modalInput} />

              <Text style={styles.modalLabel}>SKU (solo lectura)</Text>
              <TextInput value={editSku} editable={false} style={[styles.modalInput, { backgroundColor: '#f5f5f5' }]} />
              <Text style={styles.modalNote}>El SKU se genera automáticamente al crear el producto y no se edita.</Text>

              <View style={{ flexDirection: 'row' }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.modalLabel}>Precio de Costo *</Text>
                  <TextInput value={editPrecioCosto} onChangeText={setEditPrecioCosto} keyboardType="numeric" style={styles.modalInput} />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.modalLabel}>Stock *</Text>
                  <TextInput value={editStock} onChangeText={setEditStock} keyboardType="numeric" style={styles.modalInput} />
                </View>
              </View>

              <Text style={styles.modalLabel}>Categoría</Text>
              <View>
                <TouchableOpacity
                  style={[styles.modalInput, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                  onPress={() => setCategoriaOpen(v => !v)}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: editCategoria ? '#333' : '#999' }}>{editCategoria || (loadingCategorias ? 'Cargando categorías…' : 'Seleccionar categoría')}</Text>
                  <Ionicons name={categoriaOpen ? 'chevron-up-outline' : 'chevron-down-outline'} size={18} color="#666" />
                </TouchableOpacity>
                {categoriaOpen && (
                  <View style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginTop: 6, maxHeight: 180, backgroundColor: '#fff' }}>
                    <ScrollView>
                      {(categorias || []).map((cat) => (
                        <TouchableOpacity key={cat.id} onPress={() => { setEditCategoria(cat.nombre); setCategoriaOpen(false); }} style={{ paddingVertical: 10, paddingHorizontal: 12 }}>
                          <Text style={{ color: '#333' }}>{cat.nombre}</Text>
                        </TouchableOpacity>
                      ))}
                      {!categorias?.length && (
                        <View style={{ padding: 12 }}>
                          <Text style={{ color: '#666' }}>{loadingCategorias ? 'Cargando…' : 'No hay categorías disponibles'}</Text>
                        </View>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>

              <Text style={styles.modalLabel}>Descripción</Text>
              <TextInput value={editDescripcion} onChangeText={setEditDescripcion} style={[styles.modalInput, { minHeight: 80 }]} multiline />

              <Text style={styles.modalLabel}>Imágenes (máx. 5)</Text>
              <View style={styles.fakeUploadRow}>
                <Ionicons name="image-outline" size={18} color="#666" />
                <Text style={{ color: '#666', marginLeft: 8 }}>
                  {editImagenes.length ? `${editImagenes.length} archivo(s) seleccionado(s)` : 'Elegir archivos'}
                </Text>
              </View>
              {/* Input de archivos para web */}
              {/** @ts-ignore: elemento HTML para web */}
              {React.createElement('input', {
                type: 'file',
                accept: 'image/*',
                multiple: true,
                style: { marginTop: 8 },
                onChange: (e: any) => {
                  try {
                    const files: File[] = Array.from(e.target.files || []);
                    const max5 = files.slice(0, 5);
                    setEditImagenes(max5);
                  } catch {}
                }
              })}
              {editImagenes.length > 0 && (
                <View style={{ marginTop: 8 }}>
                  {editImagenes.map((f: File, idx: number) => (
                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <Ionicons name="document-text-outline" size={16} color="#777" />
                      <Text style={{ marginLeft: 6, color: '#555', flex: 1 }} numberOfLines={1}>{f.name || `imagen-${idx+1}`}</Text>
                      <TouchableOpacity onPress={() => setEditImagenes(prev => prev.filter((_, i) => i !== idx))}>
                        <Ionicons name="close-circle-outline" size={18} color="#c62828" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
                <TouchableOpacity disabled={savingEdit} onPress={guardarEdicion} style={[styles.saveBtn, savingEdit && { opacity: 0.7 }]}>
                  <Text style={styles.saveBtnText}>{savingEdit ? 'Guardando…' : 'Guardar'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5e5',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  refresh: {
    backgroundColor: '#667eea',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanBtn: { backgroundColor: '#667eea', marginRight: 8 },
  // En móvil, reducir padding para que el botón no se vea gigante
  scanBtnMobile: { paddingHorizontal: 10, paddingVertical: 6 },
  refreshBtn: { backgroundColor: '#667eea' },
  refreshText: {
    color: '#fff',
    fontWeight: '600',
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    marginTop: 8,
    color: '#555',
  },
  section: {
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionTitleChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#667eea',
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  adjustHint: { fontSize: 13, color: '#666', marginBottom: 8 },
  adjustRow: { flexDirection: 'row', alignItems: 'center' },
  adjustInput: { width: 80, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6 },
  percentMark: { marginHorizontal: 8, fontSize: 16, fontWeight: '700', color: '#333' },
  applyBtn: { backgroundColor: '#667eea', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  applyBtnText: { color: '#fff', fontWeight: '700' },
  noticeBox: { marginTop: 8, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  noticeSuccess: { backgroundColor: '#e8f5e9', borderWidth: StyleSheet.hairlineWidth, borderColor: '#c8e6c9' },
  noticeError: { backgroundColor: '#ffebee', borderWidth: StyleSheet.hairlineWidth, borderColor: '#ffcdd2' },
  noticeText: { fontSize: 13, fontWeight: '600' },
  searchInput: {
    marginLeft: 8,
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  rowEven: { backgroundColor: '#fafafa' },
  cellImage: { width: 64, height: 64, marginRight: 8 },
  image: { width: 64, height: 64, borderRadius: 8, backgroundColor: '#eee' },
  imagePlaceholder: { width: 64, height: 64, borderRadius: 8, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' },
  cellName: { flex: 1, marginRight: 8, fontWeight: '600', paddingVertical: 4, paddingHorizontal: 6 },
  cellSku: { width: 110, color: '#777', paddingVertical: 4, paddingHorizontal: 6 },
  cellMoney: { width: 140, textAlign: 'right', paddingVertical: 4, paddingHorizontal: 6 },
  cellMoneyAccent: { width: 140, textAlign: 'right', color: '#4f46e5', fontWeight: '700', paddingVertical: 4, paddingHorizontal: 6, backgroundColor: '#eef2ff', borderRadius: 4 },
  cellStock: { width: 70, textAlign: 'center', paddingVertical: 4, paddingHorizontal: 6 },
  cellDesc: { flex: 1, marginLeft: 8, color: '#555', paddingVertical: 4, paddingHorizontal: 6 },
  cellActions: { width: 90, flexDirection: 'row', justifyContent: 'flex-end' },
  iconBtn: { paddingHorizontal: 6 },
  cellBorder: { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: '#e5e5e5' },
  headerRow: { backgroundColor: '#667eea' },
  headerAccentCell: { backgroundColor: '#5b6fe7', borderRadius: 4 },
  headerCellText: { fontWeight: '700', color: '#ffffff' },
  cellImageHeader: { width: 72, height: 24, justifyContent: 'center' },
  modalLabel: { fontSize: 14, fontWeight: '600', marginBottom: 6, marginTop: 8 },
  modalInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#fff' },
  fakeUploadRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#eee', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fafafa' },
  saveBtn: { backgroundColor: '#667eea', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  saveBtnText: { color: '#fff', fontWeight: '700' },
  modalNote: { fontSize: 12, color: '#666', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 900, borderRadius: 14, backgroundColor: '#fff', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 6, borderWidth: StyleSheet.hairlineWidth, borderColor: '#e5e5e5' },
  modalHeader: { padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#667eea', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#667eea' },
  modalHeaderTitle: { fontWeight: '700', color: '#fff' },
  // Estilos móviles para tarjeta compacta
  mobileCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
  },
  mobileImage: { width: 64, height: 64, borderRadius: 8 },
  mobileTitle: { fontWeight: '700', fontSize: 15, color: '#222' },
  mobileSub: { color: '#777', marginTop: 2 },
  mobileRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  mobileLabel: { color: '#555', fontWeight: '600' },
  mobileValue: { color: '#222', marginLeft: 4 },
  mobileDesc: { color: '#555', marginTop: 6 },
  mobileActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
});

// Modal de alta rápida (debajo del StyleSheet para mantener el archivo ordenado)
// Nota: declaramos un componente inline para mantener cohesionada la pantalla.
  // Helper: construir URL de imagen compatible con backend (prefijo BASE_URL si es relativa)
  const resolveImageUrl = (input: any): string => {
    try {
      if (typeof input !== 'string') return '';
      let url = input.trim();
      if (!url) return '';
      // Normalizar duplicados en path product-images
      while (url.includes('product-images/product-images/')) {
        url = url.replace('product-images/product-images/', 'product-images/');
      }
      // Si ya es absoluta, devolver tal cual
      if (/^https?:\/\//i.test(url)) return url;
      // Si es relativa, asegurar prefijo BASE_URL y slash
      const base = API_CONFIG.BASE_URL.replace(/\/$/, '');
      const path = url.startsWith('/') ? url : `/${url}`;
      return `${base}${path}`;
    } catch {
      return '';
    }
  };