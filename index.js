import 'react-native-gesture-handler';
import 'react-native-reanimated';
import 'expo-router/entry';

// Silenciar timeouts de FontFaceObserver en desarrollo web para evitar overlays
// causados por fuentes que tardan en cargar o rutas de assets intermitentes.
if (typeof window !== 'undefined') {
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