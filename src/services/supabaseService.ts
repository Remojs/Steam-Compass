import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface AuthResponse {
  success: boolean;
  error?: string;
}

export class SupabaseService {
  static isConnected(): boolean {
    return Boolean(supabaseUrl && supabaseAnonKey);
  }

  static async signUp(email: string, password: string, username: string): Promise<AuthResponse> {
    try {
      console.log('🔧 Iniciando registro para:', email);
      
      // Verificar si el usuario ya existe
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .single();

      if (existingUser) {
        console.log('❌ Usuario ya existe:', email);
        return { 
          success: false, 
          error: 'Ya existe una cuenta con este email' 
        };
      }

      console.log('✅ Email disponible, procediendo con registro...');

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          }
        }
      });

      console.log('📝 Respuesta de Supabase signUp:', { data, error });

      if (error) {
        console.error('❌ Error en signUp:', error);
        return { 
          success: false, 
          error: error.message || 'Error al crear la cuenta' 
        };
      }

      if (!data.user) {
        console.error('❌ No se obtuvo usuario después del registro');
        return { 
          success: false, 
          error: 'Error inesperado al crear la cuenta' 
        };
      }

      console.log('🎉 Usuario registrado exitosamente:', data.user.email);
      return { success: true };

    } catch (error) {
      console.error('💥 Error inesperado en signUp:', error);
      return { 
        success: false, 
        error: 'Error inesperado del servidor' 
      };
    }
  }

  static async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log('🔧 Iniciando login para:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log('📝 Respuesta de Supabase signIn:', { data, error });

      if (error) {
        console.error('❌ Error en signIn:', error);
        return { 
          success: false, 
          error: error.message || 'Credenciales inválidas' 
        };
      }

      if (!data.user) {
        console.error('❌ No se obtuvo usuario después del login');
        return { 
          success: false, 
          error: 'Error inesperado al iniciar sesión' 
        };
      }

      console.log('🎉 Login exitoso para:', data.user.email);
      return { success: true };

    } catch (error) {
      console.error('💥 Error inesperado en signIn:', error);
      return { 
        success: false, 
        error: 'Error inesperado del servidor' 
      };
    }
  }

  static async signOut(): Promise<void> {
    try {
      console.log('🔧 Cerrando sesión...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Error al cerrar sesión:', error);
      } else {
        console.log('✅ Sesión cerrada exitosamente');
      }
    } catch (error) {
      console.error('💥 Error inesperado en signOut:', error);
    }
  }

  static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error getting current user:', error);
        return null;
      }
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  static async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
        return null;
      }
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  static onAuthStateChange(callback: (event: string, session: unknown) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}
