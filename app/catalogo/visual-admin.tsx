import { Link, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ProtectedRoute from '../../components/ProtectedRoute';
import { API_CONFIG } from '../../config/api.js';
import {
  ProductoCatalogoAdmin,
  actualizarDescripcionCatalogo,
  actualizarImagenPrincipalAdmin,
  agregarImagenesGaleriaAdmin,
  eliminarImagenGaleriaAdmin,
  eliminarImagenPrincipalAdmin,
  getCatalogProductsAdmin,
  productService,
  toggleDestacadoAdmin
} from '../../services/catalogoService';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48) / 2;
const HERO_H = 150;

function resolveImageUrl(input?: string | null): string {
  if (!input) return '';
  let url = input.trim();
  while (url.includes('product-images/product-images/')) {
    url = url.replace('product-images/product-images/', 'product-images/');
  }
  if (/^https?:\/\//i.test(url)) return url;
  const base = API_CONFIG.BASE_URL.replace(/\/$/, '');
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${base}${path}`;
}

function VisualCatalogAdmin() {
  const router = useRouter();
  const [productos, setProductos] = useState<ProductoCatalogoAdmin[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductoCatalogoAdmin | null>(null);
  const [pendingPrincipalFile, setPendingPrincipalFile] = useState<File | Blob | null>(null);
  const [updatingPrincipal, setUpdatingPrincipal] = useState<boolean>(false);
  const [pendingGalleryFiles, setPendingGalleryFiles] = useState<(File | Blob)[]>([]);
  const [savingAll, setSavingAll] = useState<boolean>(false);

  const categories = useMemo<string[]>(() => {
    const all = productos
      .map(p => p.categoria)
      .filter((x): x is string => typeof x === 'string' && x.length > 0);
    return Array.from(new Set(all));
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    return productos.filter(p => {
      const s = search.toLowerCase();
      const matchesSearch = p.nombre.toLowerCase().includes(s) || (p.descripcion || '').toLowerCase().includes(s);
      const matchesCategory = !selectedCategory || selectedCategory === 'todas' || p.categoria === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [productos, search, selectedCategory]);

  const load = async () => {
    try {
      setLoading(true);
      const items = await getCatalogProductsAdmin();
      setProductos(items);
      setError(null);
    } catch (e: any) {
      console.error('Error al cargar productos admin catálogo', e);
      setError('No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleToggleDestacado = async (p: ProductoCatalogoAdmin) => {
    try {
      const nuevo = !Boolean(p.destacado);
      await toggleDestacadoAdmin(p.id, nuevo);
      setProductos(prev => prev.map(it => it.id === p.id ? { ...it, destacado: nuevo } : it));
    } catch (e) {
      Alert.alert('Error', 'No se pudo cambiar destacado');
    }
  };

  const openModal = (p: ProductoCatalogoAdmin) => {
    setSelectedProduct(p);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
    setPendingPrincipalFile(null);
    setPendingGalleryFiles([]);
  };

  const saveAllChanges = async () => {
    if (!selectedProduct) return;
    try {
      setSavingAll(true);
      // 1) Nombre y descripción
      await actualizarDescripcionCatalogo(selectedProduct.id, {
        nombre: selectedProduct.nombre,
        descripcion: selectedProduct.descripcion,
      });

      // 2) Imagen principal, si hay seleccionada
      if (pendingPrincipalFile) {
        const res = await actualizarImagenPrincipalAdmin(selectedProduct.id, pendingPrincipalFile);
        const nueva = res?.imagen_principal ?? selectedProduct.imagen_principal;
        setSelectedProduct((sp: ProductoCatalogoAdmin | null) => sp ? { ...sp, imagen_principal: nueva } : sp);
        setProductos(prev => prev.map(p => p.id === selectedProduct.id ? { ...p, imagen_principal: nueva } : p));
        setPendingPrincipalFile(null);
      }

      // 3) Imágenes de galería, si hay seleccionadas
      if (pendingGalleryFiles.length > 0) {
        const res = await agregarImagenesGaleriaAdmin(selectedProduct.id, pendingGalleryFiles);
        const nuevas: string[] = res?.imagenes ?? selectedProduct.imagenes;
        setSelectedProduct((sp: ProductoCatalogoAdmin | null) => sp ? { ...sp, imagenes: nuevas } : sp);
        setProductos(prev => prev.map(p => p.id === selectedProduct.id ? { ...p, imagenes: nuevas } : p));
        setPendingGalleryFiles([]);
      }

      Alert.alert('Listo', 'Cambios guardados');
    } catch (e) {
      Alert.alert('Error', 'No se pudieron guardar todos los cambios');
    } finally {
      setSavingAll(false);
    }
  };

  const handleUpdatePrincipal = async (file: any) => {
    if (!selectedProduct || !file) return;
    try {
      setUpdatingPrincipal(true);
      const res = await actualizarImagenPrincipalAdmin(selectedProduct.id, file);
      const nueva = res?.imagen_principal ?? selectedProduct.imagen_principal;
      setSelectedProduct((sp: ProductoCatalogoAdmin | null) => sp ? { ...sp, imagen_principal: nueva } : sp);
      setProductos(prev => prev.map(p => p.id === selectedProduct.id ? { ...p, imagen_principal: nueva } : p));
      setPendingPrincipalFile(null);
    } catch (e: any) {
      Alert.alert('Error', 'No se pudo actualizar la imagen principal');
    } finally {
      setUpdatingPrincipal(false);
    }
  };

  const handleDeletePrincipal = async () => {
    if (!selectedProduct) return;
    try {
      await eliminarImagenPrincipalAdmin(selectedProduct.id);
      setSelectedProduct((sp: ProductoCatalogoAdmin | null) => sp ? { ...sp, imagen_principal: null } : sp);
      setProductos(prev => prev.map(p => p.id === selectedProduct.id ? { ...p, imagen_principal: null } : p));
    } catch (e) {
      Alert.alert('Error', 'No se pudo eliminar la imagen principal');
    }
  };

  const handleDeleteGalleryImage = async (img: string) => {
    if (!selectedProduct) return;
    try {
      const res = await eliminarImagenGaleriaAdmin(selectedProduct.id, img);
      const nuevas: string[] = res?.imagenes ?? (selectedProduct.imagenes || []).filter(u => u !== img);
      setSelectedProduct((sp: ProductoCatalogoAdmin | null) => sp ? { ...sp, imagenes: nuevas } : sp);
      setProductos(prev => prev.map(p => p.id === selectedProduct.id ? { ...p, imagenes: nuevas } : p));
    } catch (e) {
      Alert.alert('Error', 'No se pudo eliminar la imagen');
    }
  };

  const descargarPDF = async () => {
    try {
      await productService.downloadCatalogPDF();
    } catch (e) {
      Alert.alert('Error', 'No se pudo descargar el PDF');
    }
  };

  const renderItem = ({ item }: { item: ProductoCatalogoAdmin }) => (
    <View style={[styles.card, { width: CARD_W }]}>
      <TouchableOpacity onPress={() => openModal(item)}>
        {item.imagen_principal ? (
          <Image source={{ uri: resolveImageUrl(item.imagen_principal) }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
            <Text style={{ color: '#999' }}>Sin imagen</Text>
          </View>
        )}
      </TouchableOpacity>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.nombre}</Text>
        <Text style={styles.cardCategory}>{item.categoria}</Text>
        <View style={styles.cardMetaRow}>
          <Text style={styles.cardPrice}>${item.precio_final ?? 'N/A'}</Text>
          <Text style={styles.cardStock}>Stock: {item.stock ?? 0}</Text>
        </View>
        <View style={styles.cardButtonsRow}>
          <TouchableOpacity
            style={[styles.btn, item.destacado ? styles.btnYellow : styles.btnLight, styles.btnFlex]}
            onPress={() => handleToggleDestacado(item)}
          >
            <Text style={[styles.btnText, item.destacado ? styles.btnTextDark : null, styles.btnInnerText]}>
              {item.destacado ? 'Quitar destacado' : 'Destacar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary, styles.btnFlex]}
            onPress={() => openModal(item)}
          >
            <Text style={[styles.btnText, styles.btnInnerText]}>Imágenes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Link href="/dashboard" asChild>
          <TouchableOpacity style={styles.backBtn}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>{'< Volver'}</Text>
          </TouchableOpacity>
        </Link>
        <Text style={styles.heroTitle}>Catálogo Visual (Admin)</Text>
        <Text style={styles.heroSubtitle}>Gestiona imágenes y detalles</Text>
        <TouchableOpacity style={styles.downloadBtn} onPress={descargarPDF}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Descargar PDF</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar productos..."
          style={styles.search}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesRow}>
          <TouchableOpacity onPress={() => setSelectedCategory('')} style={[styles.catChip, !selectedCategory && styles.catChipActive]}>
            <Text style={[styles.catChipText, !selectedCategory && styles.catChipTextActive]}>Todas</Text>
          </TouchableOpacity>
          {categories.map(c => (
            <TouchableOpacity key={c} onPress={() => setSelectedCategory(c)} style={[styles.catChip, selectedCategory === c && styles.catChipActive]}>
              <Text style={[styles.catChipText, selectedCategory === c && styles.catChipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7b1fa2" />
          <Text style={{ marginTop: 8 }}>Cargando catálogo...</Text>
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={productosFiltrados}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.content}
          columnWrapperStyle={styles.row}
          ListEmptyComponent={<Text style={styles.emptyText}>No hay productos</Text>}
        />
      )}

      {/* Modal de gestión */}
      <Modal visible={showModal} animationType="slide" onRequestClose={closeModal}>
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Gestionar Producto</Text>
            <TouchableOpacity onPress={closeModal}><Text style={{ color: '#fff', fontWeight: '700' }}>Cerrar</Text></TouchableOpacity>
          </View>

          {selectedProduct && (
            <View style={{ padding: 16 }}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                value={selectedProduct.nombre}
                onChangeText={(t) => setSelectedProduct((sp: ProductoCatalogoAdmin | null) => sp ? { ...sp, nombre: t } : sp)}
                style={styles.input}
              />
              <Text style={styles.label}>Descripción</Text>
              <TextInput
                value={selectedProduct.descripcion || ''}
                onChangeText={(t) => setSelectedProduct((sp: ProductoCatalogoAdmin | null) => sp ? { ...sp, descripcion: t } : sp)}
                style={[styles.input, { height: 80 }]}
                multiline
              />
              <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={saveAllChanges} disabled={savingAll}>
                <Text style={styles.btnText}>{savingAll ? 'Guardando…' : 'Guardar cambios'}</Text>
              </TouchableOpacity>

              <View style={{ height: 16 }} />
              <Text style={styles.sectionTitle}>Imagen principal</Text>
              {selectedProduct.imagen_principal ? (
                <Image source={{ uri: resolveImageUrl(selectedProduct.imagen_principal) }} style={styles.principalImage} />
              ) : (
                <View style={[styles.principalImage, styles.cardImagePlaceholder]}><Text>Sin imagen</Text></View>
              )}

              {Platform.OS === 'web' ? (
                <View style={[styles.uploadRow, styles.uploadRowColumn]}>
                  <View style={styles.uploadButtonsRow}>
                    <View style={[styles.uploadItem, styles.uploadInputWrapper]}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e: any) => {
                          const f = e?.target?.files?.[0];
                          if (f) setPendingPrincipalFile(f);
                        }}
                        style={{ width: '100%', boxSizing: 'border-box' }}
                      />
                    </View>
                    <TouchableOpacity
                      style={[styles.btn, styles.btnPrimary, styles.uploadBtn, { opacity: (!pendingPrincipalFile || updatingPrincipal) ? 0.7 : 1 }]}
                      disabled={!pendingPrincipalFile || updatingPrincipal}
                      onPress={() => pendingPrincipalFile && handleUpdatePrincipal(pendingPrincipalFile)}
                    >
                      <Text style={styles.btnText}>{updatingPrincipal ? 'Actualizando…' : 'Actualizar principal'}</Text>
                    </TouchableOpacity>
                  </View>
                  {selectedProduct.imagen_principal && (
                    <TouchableOpacity style={[styles.btn, styles.btnDanger, styles.uploadBtn]} onPress={handleDeletePrincipal}>
                      <Text style={styles.btnText}>Eliminar principal</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <Text style={{ color: '#666' }}>Actualización de imagen disponible en la web.</Text>
              )}

              <View style={{ height: 16 }} />
              <Text style={styles.sectionTitle}>Galería ({selectedProduct.imagenes?.length || 0})</Text>
              <View style={styles.galleryGrid}>
                {(selectedProduct.imagenes || []).map((img) => (
                  <View key={img} style={styles.galleryItem}>
                    <Image source={{ uri: resolveImageUrl(img) }} style={styles.galleryImage} />
                    <TouchableOpacity style={[styles.btn, styles.btnDanger, { marginTop: 6 }]} onPress={() => handleDeleteGalleryImage(img)}>
                      <Text style={styles.btnText}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {Platform.OS === 'web' ? (
                <View style={styles.uploadRowGallery}>
                  <View style={styles.uploadItem}>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e: any) => {
                        const fl = e?.target?.files;
                        if (fl && fl.length) {
                          const arr: (File | Blob)[] = [];
                          for (let i = 0; i < fl.length; i++) {
                            const it = fl.item(i);
                            if (it) arr.push(it);
                          }
                          setPendingGalleryFiles(arr);
                        } else {
                          setPendingGalleryFiles([]);
                        }
                      }}
                    />
                  </View>
                  {pendingGalleryFiles.length > 0 ? (
                    <View style={styles.uploadInfo}>
                      <Text style={styles.uploadInfoText}>Seleccionadas: {pendingGalleryFiles.length}</Text>
                    </View>
                  ) : (
                    <View style={styles.uploadInfoBelow}>
                      <Text style={styles.uploadInfoText}>No seleccionaste imágenes aún</Text>
                    </View>
                  )}
                </View>
              ) : null}
            </View>
          )}
        </ScrollView>
      </Modal>
    </View>
  );
}

export default function VisualCatalogAdminProtected() {
  return (
    <ProtectedRoute>
      <VisualCatalogAdmin />
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { paddingHorizontal: 16, paddingBottom: 16 },
  row: { justifyContent: 'space-between', marginBottom: 16 },
  hero: { height: HERO_H, backgroundColor: '#7b1fa2', padding: 16, marginBottom: 12, justifyContent: 'center' },
  backBtn: { position: 'absolute', top: 12, left: 12 },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  heroSubtitle: { color: '#E1BEE7' },
  downloadBtn: { position: 'absolute', right: 12, top: 12, backgroundColor: '#6a1b9a', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  filters: { paddingHorizontal: 16, marginBottom: 8 },
  search: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderColor: '#ddd', borderWidth: 1 },
  categoriesRow: { marginTop: 8 },
  catChip: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, marginRight: 8 },
  catChipActive: { backgroundColor: '#7b1fa2', borderColor: '#7b1fa2' },
  catChipText: { color: '#333' },
  catChipTextActive: { color: '#fff', fontWeight: '700' },
  loadingContainer: { alignItems: 'center', justifyContent: 'center', padding: 20 },
  errorText: { textAlign: 'center', color: '#d32f2f', marginTop: 12 },
  emptyText: { textAlign: 'center', color: '#6c757d', marginTop: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  cardImage: { width: '100%', height: 130 },
  cardImagePlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#eee' },
  cardBody: { padding: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 4 },
  cardCategory: { fontSize: 12, color: '#6c757d', marginBottom: 8 },
  cardMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardPrice: { fontSize: 16, fontWeight: '700', color: '#7b1fa2' },
  cardStock: { fontSize: 12, color: '#6c757d' },
  cardButtonsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  btn: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: '700' },
  btnInnerText: { fontSize: 12 },
  btnFlex: { flex: 1, marginHorizontal: 2, alignItems: 'center' },
  btnPrimary: { backgroundColor: '#7b1fa2' },
  btnLight: { backgroundColor: '#607D8B' },
  btnYellow: { backgroundColor: '#FFC107' },
  btnTextDark: { color: '#333' },
  modalContainer: { paddingBottom: 40 },
  modalHeader: { backgroundColor: '#7b1fa2', paddingVertical: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  label: { fontWeight: '700', marginBottom: 6, color: '#333' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  principalImage: { width: '100%', height: 180, borderRadius: 12 },
  uploadRow: { marginTop: 8 },
  uploadRowColumn: { flexDirection: 'column', alignItems: 'stretch' },
  uploadButtonsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  uploadItem: { marginBottom: 8 },
  uploadInputWrapper: { flex: 1, marginRight: 8 },
  uploadBtn: { flex: 1, marginLeft: 4 },
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  galleryItem: { width: (width - 48) / 3, },
  galleryImage: { width: '100%', height: 90, borderRadius: 8 },
  btnDanger: { backgroundColor: '#d32f2f' },
  uploadRowGallery: { marginTop: 16 },
  uploadInfo: { marginTop: 8 },
  uploadInfoBelow: { marginTop: 8 },
  uploadInfoText: { color: '#666' },
});