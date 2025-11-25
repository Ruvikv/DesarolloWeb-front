import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { safeAsyncStorage } from '../services/storageUtils';
import { authService } from '../services/authService';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Eliminamos la bandera isMounted para evitar carreras que dejan isLoading en true

  // Consideramos autenticado si hay token, aunque aún no se haya cargado el perfil
  const isAuthenticated = !!token;

  // Verificar el estado de autenticación al iniciar la app
  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const storedToken = await safeAsyncStorage.getItem('authToken');
      if (storedToken) {
        setToken(storedToken);
        const userData = await safeAsyncStorage.getItem('userData');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } else {
        // Asegurar estado limpio si no hay token
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      await logout();
    } finally {
      setIsLoading(false);
    }
  };

  // Función de login
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('🔐 AuthContext: Iniciando proceso de login...');
      const result = await authService.login(email, password);
      
      if (result.success && result.data && result.data.token) {
        console.log('✅ AuthContext: Login exitoso, guardando datos...');
        // Guardar token y datos del usuario
        const data = result.data;
        await safeAsyncStorage.setItem('authToken', data.token);
        if (data.user) {
          await safeAsyncStorage.setItem('userData', JSON.stringify(data.user));
          setUser(data.user);
        }
        setToken(data.token);
        console.log('✅ AuthContext: Datos guardados correctamente');
      } else {
        console.log('❌ AuthContext: Error en respuesta del servidor:', result.error);
        throw new Error(result.error || 'No se recibió token de autenticación');
      }
    } catch (error) {
      console.log('❌ AuthContext: Error en login:', error);
      throw error; // Re-lanzar el error para que lo maneje el componente
    } finally {
      setIsLoading(false);
    }
  };

  // Función de logout
  const logout = async () => {
    try {
      // Limpiar AsyncStorage
    await safeAsyncStorage.removeItem('authToken');
    await safeAsyncStorage.removeItem('userData');
      
      // Limpiar estado
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Verificar estado de autenticación al montar el componente
  useEffect(() => {
    // Solo ejecutar en el cliente, no durante SSR
    if (typeof window === 'undefined') return;
    checkAuthStatus();
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};