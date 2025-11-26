import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import ProtectedRoute from '../components/ProtectedRoute';
import { useSettings, useThemeColors } from '../contexts/SettingsContext';

export default function ConfiguracionScreen() {
  const { theme, startRoute, density, setTheme, setStartRoute, setDensity, resetSettings } = useSettings();
  const colors = useThemeColors();
  const [isDark, setIsDark] = useState(theme === 'dark');
  const [route, setRoute] = useState(startRoute);
  const [localDensity, setLocalDensity] = useState(density);

  useEffect(() => setIsDark(theme === 'dark'), [theme]);
  useEffect(() => setRoute(startRoute), [startRoute]);
  useEffect(() => setLocalDensity(density), [density]);

  const handleToggleTheme = async (value: boolean) => {
    setIsDark(value);
    await setTheme(value ? 'dark' : 'light');
  };

  const handleSelectRoute = async (target: string) => {
    setRoute(target);
    await setStartRoute(target);
  };

  const handleSelectDensity = async (target: 'comfortable' | 'cozy' | 'compact') => {
    setLocalDensity(target);
    await setDensity(target);
  };

  return (
    <ProtectedRoute>
      <View style={[styles.container, { backgroundColor: colors.background }] }>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Configuración</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Preferencias del sistema</Text>

        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }] }>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Apariencia</Text>
          <View style={styles.rowBetween}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Modo oscuro</Text>
            <Switch value={isDark} onValueChange={handleToggleTheme} />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }] }>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Pantalla de inicio</Text>
          <View style={styles.segmentRow}>
            {[
              { label: 'Panel', value: '/dashboard' },
              { label: 'Ventas', value: '/ventas' },
              { label: 'Catálogo', value: '/catalogo/visual' },
            ].map(opt => (
              <Pressable
                key={opt.value}
                onPress={() => handleSelectRoute(opt.value)}
                style={[
                  styles.segmentItem,
                  {
                    borderColor: colors.segmentBorder,
                    backgroundColor: colors.segmentBg,
                  },
                  route === opt.value && {
                    backgroundColor: colors.accent,
                    borderColor: colors.accent,
                  }
                ]}
              >
                <Text style={[
                  styles.segmentText,
                  { color: colors.textSecondary },
                  route === opt.value && { color: '#ffffff' }
                ]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }] }>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Densidad de interfaz</Text>
          <View style={styles.segmentRow}>
            {[
              { label: 'Confortable', value: 'comfortable' as const },
              { label: 'Cómoda', value: 'cozy' as const },
              { label: 'Compacta', value: 'compact' as const },
            ].map(opt => (
              <Pressable
                key={opt.value}
                onPress={() => handleSelectDensity(opt.value)}
                style={[
                  styles.segmentItem,
                  {
                    borderColor: colors.segmentBorder,
                    backgroundColor: colors.segmentBg,
                  },
                  localDensity === opt.value && {
                    backgroundColor: colors.accent,
                    borderColor: colors.accent,
                  }
                ]}
              >
                <Text style={[
                  styles.segmentText,
                  { color: colors.textSecondary },
                  localDensity === opt.value && { color: '#ffffff' }
                ]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable style={[styles.resetBtn, { backgroundColor: colors.segmentBg, borderColor: colors.segmentBorder }]} onPress={resetSettings}>
          <Text style={[styles.resetText, { color: colors.textPrimary }]}>Restaurar valores predeterminados</Text>
        </Pressable>
      </View>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
  },
  segmentRow: {
    flexDirection: 'row',
  },
  segmentItem: {
    flexGrow: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 999,
    alignItems: 'center',
    marginRight: 8,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
  },
  resetBtn: {
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  resetText: {
    fontWeight: '600',
  }
});
