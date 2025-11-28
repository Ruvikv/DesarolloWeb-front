# Tienda – Documentación del Frontend

## Índice
- [Stack y librerías](#stack-y-librerías)
- [Estructura y decisiones de arquitectura](#estructura-y-decisiones-de-arquitectura)
- [Navegación (Drawer)](#navegación-drawer)
- [Servicios (services/)](#servicios-services)
- [Contextos (contexts/)](#contextos-contexts)
- [Pantallas](#pantallas)
 - [Panel Admin](#panel-admin)
 - [Notificaciones](#notificaciones)
- [Framework y galería de estilos](#framework-y-galería-de-estilos)
- [Cómo ejecutar](#cómo-ejecutar)
- [Backend objetivo](#backend-objetivo)
- [Notas y buenas prácticas](#notas-y-buenas-prácticas)
- [Capturas de pantalla (requerido por la cátedra)](#capturas-de-pantalla-requerido-por-la-cátedra)
- [Características clave (resumen)](#características-clave-resumen)
- [Especificaciones técnicas actuales (según package.json)](#especificaciones-técnicas-actuales-según-packagejson)
- [Arquitectura y decisiones](#arquitectura-y-decisiones)
- [Funcionalidades detalladas](#funcionalidades-detalladas)
- [Scanner y cámara](#scanner-y-cámara)
- [Scripts y entorno de desarrollo](#scripts-y-entorno-de-desarrollo)
- [Variables de entorno (.env)](#variables-de-entorno-env)
- [Ventajas del enfoque](#ventajas-del-enfoque)
- [Roadmap y pendientes](#roadmap-y-pendientes)
- [Buenas prácticas y recomendaciones](#buenas-prácticas-y-recomendaciones)
- [Troubleshooting (común)](#troubleshooting-común)
- [Publicación](#publicación)
- [Contribución](#contribución)
- [Preguntas frecuentes (FAQ)](#preguntas-frecuentes-faq)

Este repositorio contiene la aplicación móvil/web construida con Expo + React Native y navegación con Expo Router. Se describen las decisiones de arquitectura, separación por carpetas/servicios, el stack utilizado y el comportamiento de cada pantalla clave.

## Stack y librerías
- Framework: Expo 53 + React Native 0.79 (multi-plataforma Android/iOS/Web)
- Router: expo-router (navegación tipo Drawer)
- HTTP: Axios con instancias por dominio de negocio
- Estilos: styled-components (styled-components/native) v6.1.19
- Almacenamiento seguro: @react-native-async-storage/async-storage encapsulado en un wrapper SSR-safe
- Ubicación: expo-location para permisos/posición del dispositivo

## Estructura y decisiones de arquitectura
- Separación por responsabilidades en carpetas:
  - app/: pantallas y rutas file-based
  - services/: acceso a API y utilidades (cada dominio tiene su propio cliente axios)
  - contexts/: contextos globales (autenticación)
- Interceptores por servicio para:
  - Inyectar token Bearer solo cuando corresponde
  - Evitar preflight en GET removiendo Content-Type y usando un flag público (x-skip-auth)
- Persistencia de token y estado de usuario con almacenamiento seguro y verificación al iniciar la app

## Navegación (Drawer)
- Definido en app/_layout.tsx, proveído dentro de AuthProvider y CartProvider
- Rutas visibles con títulos personalizados: Inicio, Catálogo Visual, Explorar, Contacto, Carrito, Registro, Login
- Rutas ocultas para evitar duplicados: index y home/home

## Servicios (services/)
- apiService.ts
  - Instancia genérica axios (baseURL a backend)
  - Helpers: extractData, métodos HTTP get/post/put/delete
  - geolocationService: getCoordinatesFromAddress, getAddressFromCoordinates, calculateShippingCost, calculateDistance, getNearbyStores, updateStoreCoordinates (todas públicas con x-skip-auth cuando corresponde)
- catalogoService.ts (productService)
  - Instancia axios propia con interceptor que añade token si existe y respeta skipAuth
  - Normalización de producto y endpoints públicos: getPublicProducts, getVisualCatalog, getFeaturedProducts, searchProducts, getProductById
  - Descargas: Excel (`/catalogo/descargar/excel`) y PDF (`/productos/exportar/pdf`)
  - Nota: además de sus propios endpoints de `catalogo/*`, utiliza endpoints de `productos/*` para exportaciones y fallback de destacados
- categoriasService.ts
  - Instancia axios con mismo patrón de interceptor
  - Métodos: obtenerTodas, obtenerPorId (públicos)
- authService.ts
  - login/logout/getToken/isAuthenticated; limpia token en 401
- storageUtils.ts
  - safeAsyncStorage: wrapper SSR-safe de AsyncStorage (getItem/setItem/removeItem con try/catch y early return en SSR)

### Endpoints por servicio
- apiService/geolocationService
  - `GET /geolocalizacion/coordenadas` obtener coordenadas por dirección
  - `GET /geolocalizacion/direccion` obtener dirección por coordenadas
  - `POST /geolocalizacion/costo-envio` calcular costo de envío
  - `GET /geolocalizacion/distancia` calcular distancia entre dos puntos
  - `GET /geolocalizacion/tiendas-cercanas` listar tiendas cercanas
  - `POST /geolocalizacion/actualizar-coordenadas` actualizar coordenadas de tienda

- catalogoService (público + admin)
  - Público: `GET /catalogo/publico`, `GET /catalogo/visual`, `GET /catalogo/destacados`, `GET /catalogo/buscar?q=...`, `GET /catalogo/producto/:id`
  - Descargas: `GET /catalogo/descargar/excel`, `GET /productos/exportar/pdf`
  - Admin catálogo: `PATCH /catalogo/producto/:id` (nombre/descripcion), `PUT /catalogo/producto/:id/imagen-principal`, `POST /catalogo/producto/:id/imagenes`, `DELETE /catalogo/producto/:id/imagen-principal`, `DELETE /catalogo/producto/:id/imagen`, `PATCH /catalogo/producto/:id/destacado` con fallback `PATCH /productos/:id/destacado`

- productosService (admin)
  - `GET /productos?conGanancia=true` listar activos con ganancia
  - `GET /productos/inactivos` listar inactivos
  - `PUT /productos/:id` actualizar producto (multipart o JSON)
  - `PATCH /productos/:id/porcentaje-ganancia` actualizar porcentaje
  - `POST /precios/generar-consumidor-final` generar precios
  - `POST /productos/rapido` creación rápida (nombre + precio_costo)

- preciosService
  - `GET /precios/ajuste-precio-costo` obtener ajuste global
  - `PATCH /precios/ajuste-precio-costo` actualizar ajuste
  - `POST /precios/generar-consumidor-final` generar precios consumidor final
  - `POST /precios/generar-mayoristas` generar precios mayoristas
  - `GET /precios/mayoristas` obtener precios mayoristas
  - `GET /productos?conGanancia=true` productos con ganancia
  - `GET /ventas/mayoristas/precio-sugerido/:productoId` precio mayorista sugerido

- categoriasService
  - `GET /categorias` listar categorías activas
  - `GET /categorias/:id` obtener categoría por ID

- authService
  - `POST /auth/login` login
  - `GET /auth/profile` perfil
  - `POST /auth/register/admin-con-codigo` crear perfil admin
  - `POST /auth/register/revendedor` crear perfil revendedor

- pedidoService
  - `POST /usuarios/pedido-consumidor` registrar pedido consumidor (normaliza items y hace wake-up del backend)

- barcodeService
  - OpenFoodFacts: `GET https://world.openfoodfacts.org/api/v0/product/:code.json` y `GET /api/v2/product/:code`
  - UPCItemDB trial: `GET https://api.upcitemdb.com/prod/trial/lookup?upc=:code`

- prewarmService
  - Wake-up robusto del backend con: `GET /catalogo/publico`, `GET /categorias`, `GET /catalogo/destacados`

### Ejemplos de uso
- Búsqueda pública en catálogo
  ```ts
  import catalogo from './services/catalogoService';
  const productos = await catalogo.searchProducts('yerba');
  ```
- Descargar catálogo (Excel/PDF)
  ```ts
  await catalogo.downloadCatalogExcel();
  await catalogo.downloadCatalogPDF(); // usa endpoint de productos
  ```
- Actualizar producto (admin, multipart)
  ```ts
  import { productosService } from './services/productosService';
  await productosService.actualizarProductoCatalogo('123', { nombre: 'Nuevo', precio_costo: 1500 });
  ```
- Ajuste global de precios
  ```ts
  import { preciosService } from './services/preciosService';
  await preciosService.actualizarAjustePrecioCosto(45);
  ```
- Geolocalización: costo de envío
  ```ts
  import { geolocationService } from './services/apiService';
  const { costo } = await geolocationService.calculateShippingCost('Av. Siempreviva 742', 1000);
  ```
- Login y perfil
  ```ts
  import { authService } from './services/authService';
  const res = await authService.login('user@mail.com', 'password');
  const profile = await authService.getProfile();
  ```

### Tabla de relación Catálogo ↔ Productos

Esta tabla mapea los métodos de `catalogoService` con sus endpoints y, cuando corresponde, el endpoint de `productos` utilizado.

Público

| Método | Endpoint `catalogo` | Endpoint `productos` (si aplica) | Descripción |
|--------|----------------------|----------------------------------|-------------|
| `getPublicProducts()` | `GET /catalogo/publico` | — | Lista pública para home y destacados. |
| `getVisualCatalog()` | `GET /catalogo/visual` | — | Grilla del catálogo visual. |
| `getFeaturedProducts()` | `GET /catalogo/destacados` | — | Lista de productos destacados públicos. |
| `searchProducts(query)` | `GET /catalogo/buscar?q=...` | — | Búsqueda por texto. |
| `getProductById(id)` | `GET /catalogo/producto/:id` | — | Detalle de producto. |
| `downloadCatalogExcel()` | `GET /catalogo/descargar/excel` | — | Descarga Excel (requiere auth si el backend lo exige). |
| `downloadCatalogPDF()` | — | `GET /productos/exportar/pdf` | Exporta PDF del catálogo desde `productos`. |

Admin

| Método | Endpoint `catalogo` | Endpoint `productos` (si aplica) | Descripción |
|--------|----------------------|----------------------------------|-------------|
| `getCatalogProductsAdmin()` | `GET /catalogo/productos` | — | Listado de productos para administración del catálogo. |
| `actualizarDescripcionCatalogo(id, payload)` | `PATCH /catalogo/producto/:id` | — | Actualiza nombre/descripcion. |
| `toggleDestacadoAdmin(id, val)` | `PATCH /catalogo/producto/:id/destacado` | Fallback: `PATCH /productos/:id/destacado` o `PATCH /catalogo/producto/:id` | Alterna el estado de destacado. |
| `actualizarImagenPrincipalAdmin(id, file)` | `PUT /catalogo/producto/:id/imagen-principal` | — | Sube/actualiza imagen principal. |
| `agregarImagenesGaleriaAdmin(id, files)` | `POST /catalogo/producto/:id/imagenes` | — | Agrega imágenes a la galería. |
| `eliminarImagenPrincipalAdmin(id)` | `DELETE /catalogo/producto/:id/imagen-principal` | — | Elimina imagen principal. |
| `eliminarImagenGaleriaAdmin(id, url)` | `DELETE /catalogo/producto/:id/imagen` | — | Elimina una imagen de la galería. |

## Contextos (contexts/)
- AuthContext.tsx
  - Expone: user, token, isLoading, isAuthenticated, login, logout, checkAuthStatus
  - checkAuthStatus lee token y datos de usuario desde almacenamiento al inicio
  - login usa authService.login, persiste token y user; logout limpia todo
  - Proveedor global se monta en _layout para que toda la app consuma el estado

- CartContext.tsx
  - Expone: items, totalItems, totalPrice, addItem, removeItem, increaseQty, decreaseQty, clear
  - Maneja estado del carrito de compras con useReducer
  - addItem: agrega producto al carrito (si existe, incrementa cantidad)
  - removeItem: elimina producto completamente del carrito
  - increaseQty/decreaseQty: modifica cantidades (decreaseQty elimina si llega a 0)
  - clear: vacía todo el carrito
  - totalItems y totalPrice se calculan automáticamente con useMemo
  - Proveedor global se monta en _layout para acceso desde cualquier pantalla

## Pantallas
- Inicio (app/home/inicio.tsx)
  - Header con saludo dinámico (mañana/tarde/noche) y fondo decorativo
  - Acciones rápidas: Catálogo, Destacados, Ofertas (router.push a rutas del catálogo)
  - Buscador local de texto
  - Grid de categorías (usa categorías reales si están disponibles o fallback estático)
  - Carrusel horizontal de productos destacados con imagen/nombre/precio y estado vacío amigable
  - Métricas compactas (conteo de productos, categorías y destacados)
  - Datos: productService.getPublicProducts + categoriasService.obtenerTodas, con indicadores de carga y manejo de errores

- Catálogo Visual (app/catalogo/visual.tsx)
  - Búsqueda y chips de categorías en la parte superior
  - Grid 2 columnas con card de producto (imagen, nombre, categoría, precio)
  - Botón "Añadir al carrito" en cada card con confirmación via Alert
  - Filtros: por texto y por categoría (selectedCategory puede venir en params)
  - Estados: loading, "sin resultados" y lista paginada mediante FlatList/Grid manual
  - Fuentes de datos: productService (público) y categorías (público)
  - Integración con CartContext para gestión del carrito

- Explorar (app/catalogo/explore.tsx)
  - Página informativa de marca/tienda: quiénes somos y por qué elegirnos
  - Mosaico de servicios (calidad, envíos, soporte, garantía) con selección
  - CTA: ir al Catálogo Visual o a Contacto
  - Atajos de contacto con Linking: tel:, mailto:, WhatsApp
  - No muestra productos (fue rediseñada para diferenciarse del catálogo)

- Contacto (app/contacto/contacto.tsx)
  - Información de la tienda y botón "Abrir en Maps"
  - Costo de envío (estimado): ingresa dirección y costo base y se consulta geolocationService.calculateShippingCost
  - Búsqueda de tiendas cercanas:
    - Por dirección: geolocationService.getCoordinatesFromAddress + getNearbyStores
    - Con mi ubicación: permisos con expo-location y getCurrentPositionAsync, luego getNearbyStores
  - Mapa integrado simplificado con opción de abrir el mapa del sistema
  - Manejo de permisos/errores con mensajes claros

- Carrito (app/carrito.tsx)
  - Lista de productos agregados desde el catálogo con cantidades
  - Controles para aumentar/disminuir cantidad de cada producto
  - Botón "Quitar" para eliminar productos individuales
  - Cálculo automático del total de items y precio total
  - Botón "Finalizar Compra" con flujo de confirmación:
    - Validación de carrito vacío
    - Confirmación de procesamiento con mensaje "Se está procesando tu carrito, en breve procederemos al pago y datos de envío"
    - Mensaje final de confirmación, envio al mail de confirmacion (Método y ruta: POST /usuarios/pedido-consumidor y limpieza del carrito)
  

## Panel Admin
- Acceso: `app/dashboard.tsx`, visible solo con sesión iniciada (redirección a `auth/login` si no hay token).
- Tarjetas y acciones del panel:
  - `Productos` → abre `/productos`. Gestiona inventario: edición de producto, imagen principal/galería, destacado.
  - `Lista de Precios` → abre `/precios/lista`. Ajuste global y edición rápida de ítems (costo, stock, descripción) con exportación.
  - `Catálogo Visual` → abre `/catalogo/visual`. Visualización pública del catálogo con grilla e imágenes.
  - `Pedidos` → abre `/pedidos/admin`. Gestión y actualización de estados de pedidos de clientes (pantalla protegida).
  - `Compras` → abre `/compras`. Registro de compras con validaciones y confirmación.
  - `Estadísticas` → abre `/estadisticas`. Resumen económico (ventas, compras, ganancias, `alertas_stock`).
  - `Ventas` → abre `/ventas`. Registro de ventas minoristas con cálculo de totales y notificación de éxito.
  - `Configuración` → abre `/configuracion`. Preferencias del sistema.

## Notificaciones

### Sistema Dual de Notificaciones

La aplicación implementa un sistema completo de notificaciones con dos componentes principales:

#### 1. **Notificaciones Push** (Expo Notifications)
- Motor: `expo-notifications` con listener en `components/NotificationNavigator.tsx`
- **Notificaciones programadas** (solo admins):
  - **Diaria de stock**: Tarea de fondo `STOCK_DAILY_TASK` entre 09:00–09:30
    - Consulta `/resumen-economico/dashboard`
    - Muestra: "Tienes N productos con stock bajo"
    - Al tocar, navega a `/estadisticas`
  - **Recordatorio semanal**: Lunes 10:00
    - Programada con `ensureDefaultSchedules()`
    - Mensaje: "Revisa las estadísticas de la semana"
    - Al tocar, navega a `/estadisticas`
- **Requisitos**:
  - Sesión activa con rol `ADMIN`
  - Token de push registrado en el backend
  - En web, las notificaciones push no están soportadas de forma estándar

#### 2. **Notificaciones In-App** (Sistema de Campanita 🔔)
- **Componentes**:
  - `NotificationsContext.tsx`: Gestión de estado global con persistencia en AsyncStorage
  - `NotificationPanel.tsx`: Panel modal deslizable con lista de notificaciones
  - `BellButton` en `_layout.tsx`: Campanita con badge de contador

- **Tipos de notificaciones**:
  - 🛍️ **order**: Nuevos pedidos de clientes
  - 💰 **info**: Ventas y compras registradas
  - ⚠️ **stock**: Alertas de inventario crítico
  - 📊 **reminder**: Recordatorios y tareas pendientes

- **Notificaciones automáticas**:
  1. Nueva compra de cliente (al finalizar pedido)
  2. Venta registrada (al registrar venta minorista)
  3. Compra a proveedor (al registrar compra)
  4. Recordatorio diario (al abrir dashboard, una vez por día)

- **Funcionalidades**:
  - Badge con contador de no leídas
  - Panel modal con lista completa
  - Navegación al tocar notificaciones
  - Marcar como leída/eliminar/limpiar todo
  - Persistencia en AsyncStorage
  - Funciona en todas las plataformas (Web + Móvil)

**Documentación adicional**: Ver `NOTIFICACIONES_PUSH.md` y `NOTIFICACIONES_IN_APP.md`

## Cómo ejecutar
1) Instalar dependencias: npm install
2) Iniciar el proyecto: npx expo start
3) Abrir en dispositivo (Expo Go), emulador Android/iOS o web

## Backend objetivo
- Base URL configurada en los servicios: https://mi-tienda-backend-o9i7.onrender.com
- Endpoints utilizados: productos públicos, categorías públicas, geolocalización (coordenadas, distancia, envío, tiendas cercanas), auth/login y pedidos del carrito.

## Notas y buenas prácticas
- No exponer llaves ni secretos en el repositorio
- El token se almacena en AsyncStorage mediante un wrapper seguro que evita accesos en SSR
- Interceptores manejan 401 limpiando token y evitando preflight en GET
- Rutas duplicadas ocultas en Drawer para una navegación limpia

---

## Capturas de pantalla (requerido por la cátedra)

Coloca tus imágenes en assets/images/capturas/ con los siguientes nombres y se mostrarán automáticamente en este README.

> Si ves un ícono de imagen rota en GitHub, asegúrate de subir los archivos con estos nombres exactos.

- Inicio

![Inicio](assets/images/capturas/inicio.png)

- Catálogo Visual

![Catálogo Visual](assets/images/capturas/catalogo-visual.png)

- Explorar

![Explorar](assets/images/capturas/explorar.png)

- Contacto

![Contacto](assets/images/capturas/contacto.png)

- Login

![Login](assets/images/capturas/login.png)

- Registro

![Registro](assets/images/capturas/registro.png)

- Carrito

![Carrito](assets/images/capturas/carrito.png)

>

## Características clave (resumen)
- Inicio público con acceso rápido a catálogo, destacados y ofertas.
- Catálogo Visual con búsqueda, filtros por categoría y cards con acción al carrito.
- Lista de Precios con render compacto móvil (sin scroll horizontal) y acciones claras.
- Carrito con gestión de cantidades, totales y finalización de compra.
- Contacto con cálculo de envío, tiendas cercanas y apertura de mapa.
- Exploración de marca con CTA y enlaces directos (tel, mailto, WhatsApp).
- Autenticación y rutas protegidas (login/registro y `ProtectedRoute`).
- Soporte Web desde el mismo código (`react-native-web` + Metro bundler).
- Dev server estable en `http://localhost:8081` y proxy de desarrollo para APIs.

## Especificaciones técnicas actuales (según package.json)
- Expo `~51.0.0`, React Native `0.74.5`, React `18.2.0`.
- Expo Router `~3.5.24` (rutas file-based en `app/`).
- TypeScript `~5.8.3`, Babel `@babel/core ^7.25.2`.
- UI/UX: `styled-components ^6.1.0`, `@expo/vector-icons ^14.0.3`.
- Navegación y experiencia: `react-native-gesture-handler ~2.16.1`, `react-native-reanimated ~3.10.1`, `react-native-screens 3.31.1`, `react-native-safe-area-context 4.10.5`.
- Web: `react-native-web ~0.19.10`, bundler Metro.
- Datos y almacenamiento: `axios ^1.7.9`, `@react-native-async-storage/async-storage 1.23.1`.
- Mapas y ubicación: `react-native-maps 1.14.0`, `expo-location ~17.0.1`.
- Cámara: `expo-camera ~15.0.14`.
- Utilitarios dev: `express ^4.19.2`, `http-proxy-middleware ^3.0.0`.

## Arquitectura y decisiones
- Ruteo por archivos en `app/` con `expo-router` y layout global en `_layout.tsx`.
- Contextos globales: `AuthContext` y `CartContext` para autenticación y carrito.
- Servicios (`services/`) por dominio: `apiService`, `productosService`, `preciosService`, `authService`, `categoriasService`, `prewarmService`.
- Interceptores por servicio: inyección de token Bearer, manejo de `401`, flag público (`x-skip-auth`) y reducción de preflight en GET.
- Almacenamiento seguro: wrapper SSR‑safe sobre AsyncStorage (`storageUtils.ts`).
- Componentes de infraestructura: `ProtectedRoute`, `AddressAutocomplete`.

## Funcionalidades detalladas
- Inicio (`app/home/inicio.tsx`): saludo dinámico, acciones rápidas, buscador, grid de categorías, carrusel de destacados, métricas.
- Catálogo Visual (`app/catalogo/visual.tsx`): búsqueda, chips de categorías, grid de productos con CTA al carrito, estados y paginación simple.
- Explorar (`app/catalogo/explore.tsx`): información de marca y servicios, CTA hacia catálogo/contacto y atajos de linking.
- Contacto (`app/contacto/contacto.tsx`): costo de envío, tiendas cercanas por dirección/ubicación, mapa y permisos.
- Carrito (`app/carrito.tsx`): gestión completa de ítems y confirmación de pedido.
- Precios (`app/precios/lista.tsx`): lista optimizada para móvil, tarjetas compactas, acciones y edición rápida.
- Auth (`app/auth/login.tsx`, `registerAdmin.tsx`, `registerRevendedor.tsx`): flujo de autenticación y registro con persistencia de token.

## Scanner y cámara
- Móvil: lectura con `expo-camera` y UX de permisos.
- Web: uso de `BarcodeDetector` nativo cuando disponible y entrada manual como fallback.
- Nota: `@zxing/browser` está presente en dependencias; para evitar errores de bundling se usa preferencia por nativo o entrada manual.

## Scripts y entorno de desarrollo
- `npm run start` o `npx expo start`: arranca el bundler y servidores.
- `npm run web` o `expo start --web`: modo web con Metro.
- `npm run web:8081`: asegura el puerto `8081` estable (script `scripts/ensure-8081.js`).
- `npm run proxy`: inicia un proxy Express para facilitar llamadas a backend en desarrollo.
- `scripts/reset-project.js`: utilitario para limpiar cachés en caso de problemas.

## Variables de entorno (`.env`)
- Mantener claves y URLs fuera del repo (no versionar `.env`).
- Variables típicas: `API_BASE_URL`, `MAPS_API_KEY`, flags de entorno.
- Consultar `config/api.js` y servicios para rutas base y consumo.

## Ventajas del enfoque
- Un solo código para Android/iOS/Web, reduciendo tiempos y costos.
- Arquitectura modular por dominios con servicios y contextos reutilizables.
- Estilos declarativos con `styled-components` que facilitan el temado.
- Experiencia móvil optimizada (gestos, reanimated, safe areas).
- Infraestructura de dev estable en `localhost:8081` con proxy y scripts.

## Roadmap y pendientes
- Accesibilidad: roles, labels y navegación por teclado en web.
- Performance: virtualización/paginación para listas grandes en Catálogo/Precios.
- Experiencia de cámara en web: evaluar librería liviana o mantener `BarcodeDetector` + mejora de fallback.
- Mejora de UI: botones de acción más grandes en tarjetas móviles y consistencia visual.
- Estado y datos: indicadores de carga y skeletons en vistas con fetch.
- Testing: unitarios (servicios, reducers) e integración básica de pantallas.
- CI/CD: pipeline para QA y builds automáticos (Android/iOS/Web).
- Offline: cache de catálogo y precios, manejo de reconexión.
- Seguridad: sanitización adicional de entrada, logs y reporte de errores.
- Internacionalización: soporte multi-idioma.

## Buenas prácticas y recomendaciones
- No exponer secretos; manejar tokens vía `storageUtils` y servicios.
- Manejo robusto de errores en servicios con mensajes amigables.
- Evitar cambios de API sin versionar `swagger.json` y `config/api.js`.
- Mantener consistencia de diseño; documentar decisiones en PRs.

## Troubleshooting (común)
- Puerto ocupado (`8081`): liberar proceso o usar `npm run web:8081`.
- Bundling web con ZXing: preferir `BarcodeDetector`; si falla, usar entrada manual.
- Caches corruptas: ejecutar `scripts/reset-project.js` y reinstalar dependencias.
- Permisos de ubicación: revisar configuración y `expo-location` en Android/iOS.

## Publicación
- Android: `expo run:android` para generar build local y pruebas en emulador/dispositivo.
- iOS: `expo run:ios` (requiere macOS y Xcode).
- Web: `expo start --web` y despliegue estático (`expo.web.output: static`).

## Contribución
- Estándar de código: TypeScript, ESLint y convenciones de carpetas.
- PRs con descripción clara: contexto, alcance y capturas.
- Issues: reproducibilidad, pasos y entorno.

## Preguntas frecuentes (FAQ)
- ¿Por qué `localhost:8081`? Mantiene consistencia y evita conflictos con otros procesos. Si el puerto está ocupado, usa `npm run web:8081` o libera el proceso activo.
- ¿Qué hago si el bundler web falla por `@zxing/browser`? Preferir `BarcodeDetector` nativo; si no está disponible, usar entrada manual. En caso de error, limpiar cachés con `scripts/reset-project.js`.
- ¿Dónde configuro el `baseURL`? Ver `config/api.js` y servicios en `services/`; las variables sensibles van en `.env` (no versionado).
- ¿Cómo pruebo cámara? En móvil con `expo-camera` y Expo Go; en web, probar en Chrome con `BarcodeDetector` o usar el campo manual.
- ¿Cómo agrego una pantalla nueva? Crear archivo en `app/` (por ejemplo `app/nueva.tsx`), exportar el componente y enlazar desde el layout o navegación.
- ¿Cómo actualizo versiones sin romper? Revisar compatibilidad en Expo y RN, actualizar gradualmente (`expo doctor`, release notes), y probar en web + móvil.
- ¿Cómo reporto bugs y aportar? Abrir issue con pasos reproducibles y entorno; para PRs, incluir descripción, alcance y capturas.
 - ¿Qué servicios existen y qué hace cada uno?
   - `apiService.ts`: cliente Axios genérico con `get`, `post`, `put`, `patch`, `delete`, interceptores para token y manejo de errores. Incluye `geolocationService` con: `getCoordinatesFromAddress`, `getAddressFromCoordinates`, `calculateShippingCost`, `calculateDistance`, `getNearbyStores`, `updateStoreCoordinates`.
   - `authService.ts`: autenticación y perfiles. Métodos: `login(email, password)`, `getProfile()`, `createProfileAdmin(...)`, `createProfileRevendedor(...)`.
   - `productosService.ts` (admin): catálogo y precios. Métodos: `listarActivos()`, `listarInactivos()`, `actualizarProductoCatalogo(id, payload)` (multipart con fallback JSON), `actualizarPorcentaje(id, porcentaje)`, `generarPreciosConsumidorFinal()`, `crearRapido({ nombre, precio_costo })`.
   - `preciosService.ts`: ajustes y generación de precios. Métodos: `getAjustePrecioCosto()`, `actualizarAjustePrecioCosto(valor)`, `generarPreciosConsumidorFinal()`, `generarPreciosMayoristas()`, `obtenerPreciosMayoristas()`, `obtenerProductosConGanancia()`, `getPrecioMayoristaSugerido(productoId)`.
   - `categoriasService.ts`: categorías activas y detalle. Métodos: `obtenerTodas()`, `obtenerPorId(id)`.
   - `pedidoService.ts`: registro de pedidos de consumidores. Método: `registrarPedidoConsumidor(payload)` (normaliza items y realiza wake-up del backend antes del POST).
   - `barcodeService.ts`: búsqueda global por código de barras. Método: `buscarProductoGlobal(code)` (consulta OpenFoodFacts y UPCItemDB trial).
   - `prewarmService.ts`: pre-calentamiento del backend Render. Métodos: `checkBackendHealth()`, `warmupBackend()`, `startWarmup()`, `getBackendStatus()` (exponential backoff y verificación periódica).
   - `storageUtils.ts`: wrapper SSR-safe para almacenamiento. Métodos: `safeAsyncStorage.getItem`, `setItem`, `removeItem`.
   
   Ver sección [Servicios (services/)](#servicios-services) para detalles y ejemplos.
