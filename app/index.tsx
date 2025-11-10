import { Redirect } from 'expo-router';
import React from 'react';

export default function Index() {
  // La app debe iniciar siempre en la pantalla de inicio pública
  return <Redirect href={'/home/inicio'} />;
}
