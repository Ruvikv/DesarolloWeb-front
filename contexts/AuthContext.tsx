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

  const isAuthenticated = !!token && !!user;

  // Verificar el estado de autenticación al iniciar la app
  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const storedToken = await safeAsyncStorage.getItem('authToken');
      
      if (storedToken) {
        setToken(storedToken);
        // Aquí podrías hacer una llamada para obtener los datos del usuario
        // Por ahora, asumimos que el token es válido
        // En una implementación real, harías una llamada a /auth/me o similar
        const userData = await safeAsyncStorage.getItem('userData');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      // Si hay error, limpiar el estado
      await logout();
    } finally {
      setIsLoading(false);
    }
  };

  // Función de login
  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      
      // Guardar token y datos del usuario
      await safeAsyncStorage.setItem('authToken', response.token);
      if (response.user) {
        await safeAsyncStorage.setItem('userData', JSON.stringify(response.user));
        setUser(response.user);
      }
      
      setToken(response.token);
    } catch (error) {
      throw error; // Re-lanzar el error para que lo maneje el componente
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