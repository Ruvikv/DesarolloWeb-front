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
  const [isMounted, setIsMounted] = useState(false);

  const isAuthenticated = !!token && !!user;

  // Verificar el estado de autenticación al iniciar la app
  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const storedToken = await safeAsyncStorage.getItem('authToken');
      
      console.log('🔍 AuthContext: Verificando estado de auth...');
      console.log('🔍 AuthContext: Token encontrado:', !!storedToken);
      if (storedToken) {
        console.log('🔍 AuthContext: Token length:', storedToken.length);
        console.log('🔍 AuthContext: Token starts with:', storedToken.substring(0, 30) + '...');
      }
      
      if (storedToken) {
        setToken(storedToken);
        // En una implementación real, podrías obtener los datos del usuario del backend
        const userData = await safeAsyncStorage.getItem('userData');
        if (userData) {
          setUser(JSON.parse(userData));
          console.log('✅ AuthContext: Usuario restaurado desde storage');
        }
      } else {
        console.log('❌ AuthContext: No hay token almacenado');
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
      console.log('🔐 AuthContext: Iniciando proceso de login...');
      const result = await authService.login(email, password);
      
      if (result.success) {
        console.log('✅ AuthContext: Login exitoso, guardando datos...');
        // Guardar token y datos del usuario
        // El servidor retorna 'access_token', no 'token'
        const { access_token, user } = result.data;
        
        // Verificar que el token existe antes de acceder a sus propiedades
        if (!access_token) {
          console.log('❌ AuthContext: access_token es undefined o null');
          throw new Error('Token no recibido del servidor');
        }
        
        // Log detallado del token recibido
        console.log('🔑 AuthContext: Token recibido length:', access_token.length);
        console.log('🔑 AuthContext: Token starts with:', access_token.substring(0, 30) + '...');
        
        await safeAsyncStorage.setItem('authToken', access_token);
        if (user) {
          await safeAsyncStorage.setItem('userData', JSON.stringify(user));
          setUser(user);
        }
        setToken(access_token);
        
        // Verificar que se guardó correctamente
        const savedToken = await safeAsyncStorage.getItem('authToken');
        console.log('✅ AuthContext: Token guardado correctamente:', savedToken === access_token);
        console.log('✅ AuthContext: Datos guardados correctamente');
      } else {
        console.log('❌ AuthContext: Error en respuesta del servidor:', result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.log('❌ AuthContext: Error en login:', error);
      throw error; // Re-lanzar el error para que lo maneje el componente
    } finally {
      // Asegurar salida de estado de carga tras login
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

  // Marcar como montado/desmontado
  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  // Ejecutar verificación de auth una vez montado
  useEffect(() => {
    if (!isMounted) return;
    if (typeof window === 'undefined') return;
    checkAuthStatus();
  }, [isMounted]);

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