import 'expo-router/entry';
import 'react-native-gesture-handler';
import 'react-native-reanimated';

// Silenciar timeouts de FontFaceObserver en desarrollo web para evitar overlays
// causados por fuentes que tardan en cargar o rutas de assets intermitentes.
// En React Native (Hermes), window puede existir sin addEventListener.
// Solo registrar el handler en web/navegador.
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('unhandledrejection', (event) => {
    try {
      const reason = event?.reason;
      const msg = String(reason?.message || reason || '');
      const stack = String(reason?.stack || '');
      const isFontObserverTimeout = /timeout exceeded/i.test(msg) && /fontfaceobserver/i.test(stack);
      if (isFontObserverTimeout) {
        console.warn('[web] Ignorando FontFaceObserver timeout:', reason);
        event.preventDefault();
      }
    } catch (_) {}
  });
}
