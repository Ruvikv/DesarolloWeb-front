# Tienda – Documentación del Frontend

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
  - Normalización de producto y endpoints públicos: getPublicProducts, searchProducts (según backend)
- categoriasService.ts
  - Instancia axios con mismo patrón de interceptor
  - Métodos: obtenerTodas, obtenerPorId (públicos)
- authService.ts
  - login/logout/getToken/isAuthenticated; limpia token en 401
- storageUtils.ts
  - safeAsyncStorage: wrapper SSR-safe de AsyncStorage (getItem/setItem/removeItem con try/catch y early return en SSR)

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
  

## Framework y galería de estilos
- Framework: Expo + React Native con expo-router
- Estilos: styled-components/native (v6.1.19). Componentes con props, sombras, colores y estados (chips activos, etc.). No se utiliza una librería de UI pesada para mantener control total del diseño.

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
