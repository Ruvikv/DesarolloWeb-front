import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import safeAsyncStorage from '../services/storageUtils';

type ThemeMode = 'light' | 'dark';

type ThemeColors = {
  background: string;
  cardBackground: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  accent: string;
  segmentBg: string;
  segmentBorder: string;
};

type SettingsState = {
  theme: ThemeMode;
  startRoute: string; // e.g. '/dashboard' | '/ventas' | '/catalogo/visual' | '/home'
  density: 'comfortable' | 'cozy' | 'compact';
};

type SettingsContextType = SettingsState & {
  setTheme: (mode: ThemeMode) => Promise<void>;
  setStartRoute: (route: string) => Promise<void>;
  setDensity: (d: 'comfortable' | 'cozy' | 'compact') => Promise<void>;
  resetSettings: () => Promise<void>;
};

const DEFAULT_SETTINGS: SettingsState = {
  theme: 'light',
  startRoute: '/home',
  density: 'comfortable',
};

function getColors(theme: ThemeMode): ThemeColors {
  if (theme === 'dark') {
    return {
      background: '#0f172a', // slate-900
      cardBackground: '#1f2937', // gray-800
      textPrimary: '#e5e7eb', // gray-200
      textSecondary: '#9ca3af', // gray-400
      border: '#374151', // gray-700
      accent: '#667eea', // indigo-500
      segmentBg: '#1f2937',
      segmentBorder: '#374151',
    };
  }
  return {
    background: '#f9fafb', // gray-50
    cardBackground: '#ffffff',
    textPrimary: '#111827', // gray-900
    textSecondary: '#6b7280', // gray-500
    border: '#e5e7eb', // gray-200
    accent: '#667eea', // indigo-500
    segmentBg: '#eef2ff', // indigo-50
    segmentBorder: '#c7d2fe', // indigo-200
  };
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const theme = (await safeAsyncStorage.getItem('settings.theme')) as ThemeMode | null;
        const startRoute = (await safeAsyncStorage.getItem('settings.startRoute'));
        const density = (await safeAsyncStorage.getItem('settings.density')) as SettingsState['density'] | null;
        if (mounted) {
          setSettings({
            theme: theme === 'dark' ? 'dark' : 'light',
            startRoute: startRoute || DEFAULT_SETTINGS.startRoute,
            density: density === 'compact' || density === 'cozy' ? density : DEFAULT_SETTINGS.density,
          });
          setHydrated(true);
        }
      } catch {
        setHydrated(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const setTheme = async (mode: ThemeMode) => {
    setSettings(prev => ({ ...prev, theme: mode }));
    await safeAsyncStorage.setItem('settings.theme', mode);
  };

  const setStartRoute = async (route: string) => {
    setSettings(prev => ({ ...prev, startRoute: route }));
    await safeAsyncStorage.setItem('settings.startRoute', route);
  };

  const setDensity = async (d: SettingsState['density']) => {
    setSettings(prev => ({ ...prev, density: d }));
    await safeAsyncStorage.setItem('settings.density', d);
  };

  const resetSettings = async () => {
    setSettings(DEFAULT_SETTINGS);
    await safeAsyncStorage.removeItem('settings.theme');
    await safeAsyncStorage.removeItem('settings.startRoute');
    await safeAsyncStorage.removeItem('settings.density');
  };

  const value = useMemo<SettingsContextType>(() => ({
    ...settings,
    setTheme,
    setStartRoute,
    setDensity,
    resetSettings,
  }), [settings]);

  // Mantener siempre el Provider para evitar errores de contexto durante la hidratación.
  // Mientras se hidrata, se usa el estado por defecto y luego se actualiza.
  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings debe usarse dentro de SettingsProvider');
  return ctx;
}

export function useThemeColors(): ThemeColors {
  const { theme } = useSettings();
  return getColors(theme);
}

export function useHeaderTheme() {
  const { theme } = useSettings();
  const headerStyle = theme === 'dark' ? { backgroundColor: '#121212' } : { backgroundColor: '#ffffff' };
  const headerTintColor = theme === 'dark' ? '#ffffff' : '#000000';
  return { headerStyle, headerTintColor };
}
