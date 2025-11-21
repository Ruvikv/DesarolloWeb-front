import React, { useEffect } from 'react';
import InicioScreen from './inicio';

export default function HomeIndex() {
  console.log('[HomeIndex] render → InicioScreen');
  useEffect(() => {
    console.log('[HomeIndex] mounted');
  }, []);

  return <InicioScreen />;
}