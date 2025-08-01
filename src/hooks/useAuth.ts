import { useState, useEffect, createContext, useContext } from 'react';
import { SupabaseService } from '../services/supabaseService';

interface User {
  id: string;
  email: string;
  username: string;
  display_name?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      try {
        if (SupabaseService.isConnected()) {
          const session = await SupabaseService.getCurrentSession();
          if (session?.user) {
            // Para el nuevo servicio, usamos los datos del usuario directamente
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              username: session.user.user_metadata?.username || 'Usuario',
              display_name: session.user.user_metadata?.username || 'Usuario',
            });
          }
        } else {
          // Modo desarrollo sin Supabase
          const token = localStorage.getItem('steam_token');
          const userData = localStorage.getItem('steam_user');
          
          if (token && userData) {
            try {
              setUser(JSON.parse(userData));
            } catch (error) {
              localStorage.removeItem('steam_token');
              localStorage.removeItem('steam_user');
            }
          }
        }
      } catch (error) {
        console.error('Error verificando sesión:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Subscribe to auth changes if Supabase is configured
    if (SupabaseService.isConnected()) {
      const { data: { subscription } } = SupabaseService.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_IN' && session && typeof session === 'object' && session !== null && 'user' in session) {
            const sessionObj = session as { user: { id: string; email?: string; user_metadata?: { username?: string } } };
            setUser({
              id: sessionObj.user.id,
              email: sessionObj.user.email || '',
              username: sessionObj.user.user_metadata?.username || 'Usuario',
              display_name: sessionObj.user.user_metadata?.username || 'Usuario',
            });
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
          }
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      if (SupabaseService.isConnected()) {
        const result = await SupabaseService.signIn(email, password);
        
        if (!result.success) {
          console.error('Error en login:', result.error);
          return { success: false, error: result.error };
        }
        
        // Obtener la sesión actual después del login exitoso
        const session = await SupabaseService.getCurrentSession();
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            username: session.user.user_metadata?.username || 'Usuario',
            display_name: session.user.user_metadata?.username || 'Usuario',
          });
        }
        
        return { success: true };
      } else {
        // Modo desarrollo sin Supabase
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (email && password.length >= 6) {
          const mockUser: User = {
            id: '1',
            email,
            username: email.split('@')[0],
            display_name: email.split('@')[0],
          };
          
          const mockToken = 'steam_token_' + Date.now();
          
          localStorage.setItem('steam_token', mockToken);
          localStorage.setItem('steam_user', JSON.stringify(mockUser));
          setUser(mockUser);
          return { success: true };
        }
      }
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, error: 'Error interno del servidor' };
    } finally {
      setIsLoading(false);
    }
    
    return { success: false, error: 'Credenciales inválidas' };
  };

  const register = async (email: string, username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      if (SupabaseService.isConnected()) {
        const result = await SupabaseService.signUp(email, password, username);
        
        if (!result.success) {
          console.error('Error en registro:', result.error);
          return { success: false, error: result.error };
        }
        
        // Obtener la sesión actual después del registro exitoso
        const session = await SupabaseService.getCurrentSession();
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            username: session.user.user_metadata?.username || username,
            display_name: session.user.user_metadata?.username || username,
          });
        }
        
        return { success: true };
      } else {
        // Modo desarrollo sin Supabase
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (email && username && password.length >= 6) {
          const mockUser: User = {
            id: '1',
            email,
            username,
            display_name: username,
          };
          
          const mockToken = 'steam_token_' + Date.now();
          
          localStorage.setItem('steam_token', mockToken);
          localStorage.setItem('steam_user', JSON.stringify(mockUser));
          setUser(mockUser);
          return { success: true };
        }
      }
    } catch (error) {
      console.error('Error en registro:', error);
      return { success: false, error: 'Error interno del servidor' };
    } finally {
      setIsLoading(false);
    }
    
    return { success: false, error: 'Error desconocido' };
  };

  const logout = async () => {
    try {
      if (SupabaseService.isConnected()) {
        await SupabaseService.signOut();
      } else {
        // Modo desarrollo
        localStorage.removeItem('steam_token');
        localStorage.removeItem('steam_user');
      }
      
      // Limpiar caché de juegos al cerrar sesión
      localStorage.removeItem('steamcompass_games_cache');
      console.log('🧹 Caché de juegos limpiado al cerrar sesión');
      
      setUser(null);
    } catch (error) {
      console.error('Error en logout:', error);
      // Forzar logout local incluso si falla Supabase
      setUser(null);
      localStorage.removeItem('steam_token');
      localStorage.removeItem('steam_user');
      localStorage.removeItem('steamcompass_games_cache');
    }
  };

  return {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isLoading
  };
};

export { AuthContext };
