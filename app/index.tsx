import { Redirect } from 'expo-router';
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

export default function Index() {
  const { startRoute } = useSettings();
  const { token } = useAuth();
  // Aplicar preferencia solo si hay sesión. Si no, ir al login.
  const target = token ? (startRoute || '/home') : '/auth/login';
  console.log('[Index] redirect →', target);
  return <Redirect href={target as any} />;
}
