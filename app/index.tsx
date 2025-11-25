import { Redirect } from 'expo-router';

export default function Index() {
  // Redirigir inmediatamente a Inicio si alguien accede a la raíz
  console.log('[Index] redirect → /home');
  return <Redirect href="/home" />;
}
