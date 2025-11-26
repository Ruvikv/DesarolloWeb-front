import React from 'react';
import { Dimensions, PixelRatio } from 'react-native';

// Breakpoints comunes
export const BREAKPOINTS = {
  MOBILE_SMALL: 320,
  MOBILE_MEDIUM: 375,
  MOBILE_LARGE: 414,
  TABLET_SMALL: 600,
  TABLET_LARGE: 768,
  DESKTOP_SMALL: 1024,
  DESKTOP_MEDIUM: 1200,
  DESKTOP_LARGE: 1440,
};

// Categorías de dispositivos
export const DEVICE_CATEGORIES = {
  MOBILE_SMALL: 'MOBILE_SMALL',
  MOBILE_MEDIUM: 'MOBILE_MEDIUM',
  MOBILE_LARGE: 'MOBILE_LARGE',
  TABLET: 'TABLET',
  DESKTOP: 'DESKTOP',
} as const;

export type DeviceCategory = keyof typeof DEVICE_CATEGORIES;

// Obtener dimensiones actuales
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Detectar categoría de dispositivo
export const getDeviceCategory = (width: number = screenWidth): DeviceCategory => {
  if (width < BREAKPOINTS.MOBILE_MEDIUM) return DEVICE_CATEGORIES.MOBILE_SMALL;
  if (width < BREAKPOINTS.MOBILE_LARGE) return DEVICE_CATEGORIES.MOBILE_MEDIUM;
  if (width < BREAKPOINTS.TABLET_SMALL) return DEVICE_CATEGORIES.MOBILE_LARGE;
  if (width < BREAKPOINTS.TABLET_LARGE) return DEVICE_CATEGORIES.TABLET;
  return DEVICE_CATEGORIES.DESKTOP;
};

// Funciones de utilidad para responsive design
export const responsive = {
  // Escalar tamaños de fuente
  fontSize: (size: number, factor: number = 0.5) => {
    const category = getDeviceCategory();
    const scale = PixelRatio.getFontScale();
    
    let multiplier = 1;
    switch (category) {
      case DEVICE_CATEGORIES.MOBILE_SMALL:
        multiplier = 0.85;
        break;
      case DEVICE_CATEGORIES.MOBILE_MEDIUM:
        multiplier = 0.9;
        break;
      case DEVICE_CATEGORIES.MOBILE_LARGE:
        multiplier = 0.95;
        break;
      case DEVICE_CATEGORIES.TABLET:
        multiplier = 1.1;
        break;
      case DEVICE_CATEGORIES.DESKTOP:
        multiplier = 1.2;
        break;
    }
    
    return Math.round(PixelRatio.roundToNearestPixel(size * multiplier * scale));
  },

  // Escalar dimensiones (width, height, padding, margin)
  scale: (size: number) => {
    const category = getDeviceCategory();
    
    let multiplier = 1;
    switch (category) {
      case DEVICE_CATEGORIES.MOBILE_SMALL:
        multiplier = 0.8;
        break;
      case DEVICE_CATEGORIES.MOBILE_MEDIUM:
        multiplier = 0.9;
        break;
      case DEVICE_CATEGORIES.MOBILE_LARGE:
        multiplier = 1;
        break;
      case DEVICE_CATEGORIES.TABLET:
        multiplier = 1.15;
        break;
      case DEVICE_CATEGORIES.DESKTOP:
        multiplier = 1.3;
        break;
    }
    
    return Math.round(PixelRatio.roundToNearestPixel(size * multiplier));
  },

  // Obtener número de columnas para grids
  getGridColumns: (baseColumns: number = 2) => {
    const category = getDeviceCategory();
    
    switch (category) {
      case DEVICE_CATEGORIES.MOBILE_SMALL:
      case DEVICE_CATEGORIES.MOBILE_MEDIUM:
        return Math.max(1, baseColumns - 1);
      case DEVICE_CATEGORIES.MOBILE_LARGE:
        return baseColumns;
      case DEVICE_CATEGORIES.TABLET:
        return baseColumns + 1;
      case DEVICE_CATEGORIES.DESKTOP:
        return baseColumns + 2;
      default:
        return baseColumns;
    }
  },

  // Verificar si es móvil
  isMobile: () => {
    const category = getDeviceCategory();
    return category.includes('MOBILE');
  },

  // Verificar si es tablet o desktop
  isTabletOrDesktop: () => {
    const category = getDeviceCategory();
    return category === DEVICE_CATEGORIES.TABLET || category === DEVICE_CATEGORIES.DESKTOP;
  },
};

// Hooks para responsive design
export const useResponsive = () => {
  const [dimensions, setDimensions] = React.useState({
    width: screenWidth,
    height: screenHeight,
  });

  React.useEffect(() => {
    const onChange = ({ window }: { window: typeof dimensions }) => {
      setDimensions(window);
    };

    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

  const deviceCategory = getDeviceCategory(dimensions.width);
  
  return {
    width: dimensions.width,
    height: dimensions.height,
    deviceCategory,
    isMobile: deviceCategory.includes('MOBILE'),
    isTablet: deviceCategory === DEVICE_CATEGORIES.TABLET,
    isDesktop: deviceCategory === DEVICE_CATEGORIES.DESKTOP,
    isTabletOrDesktop: deviceCategory === DEVICE_CATEGORIES.TABLET || deviceCategory === DEVICE_CATEGORIES.DESKTOP,
  };
};

// Funciones de utilidad adicionales
export const screenUtils = {
  // Calcular ancho de tarjeta para grids
  getCardWidth: (columns: number, spacing: number = 16) => {
    const totalSpacing = spacing * (columns + 1);
    return Math.floor((screenWidth - totalSpacing) / columns);
  },

  // Calcular tamaño de fuente para headers
  getHeaderFontSize: () => {
    const category = getDeviceCategory();
    
    switch (category) {
      case DEVICE_CATEGORIES.MOBILE_SMALL:
        return 24;
      case DEVICE_CATEGORIES.MOBILE_MEDIUM:
        return 26;
      case DEVICE_CATEGORIES.MOBILE_LARGE:
        return 28;
      case DEVICE_CATEGORIES.TABLET:
        return 32;
      case DEVICE_CATEGORIES.DESKTOP:
        return 36;
      default:
        return 28;
    }
  },

  // Calcular padding responsivo
  getResponsivePadding: () => {
    const category = getDeviceCategory();
    
    switch (category) {
      case DEVICE_CATEGORIES.MOBILE_SMALL:
        return 12;
      case DEVICE_CATEGORIES.MOBILE_MEDIUM:
      case DEVICE_CATEGORIES.MOBILE_LARGE:
        return 16;
      case DEVICE_CATEGORIES.TABLET:
        return 24;
      case DEVICE_CATEGORIES.DESKTOP:
        return 32;
      default:
        return 16;
    }
  },
};

export default {
  BREAKPOINTS,
  DEVICE_CATEGORIES,
  getDeviceCategory,
  responsive,
  useResponsive,
  screenUtils,
};