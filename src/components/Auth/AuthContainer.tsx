import { useState } from 'react';
import { Login } from './Login';
import { Register } from './Register';
import SupabaseStatus from '../SupabaseStatus';
import { Compass } from 'lucide-react';

export const AuthContainer = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-accent flex items-center justify-center p-2">
              <Compass className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Steam Compass</h1>
          </div>
          <p className="text-muted-foreground">
            Tu brújula para navegar tu biblioteca de juegos
          </p>
        </div>

        {/* Supabase Status */}
        <SupabaseStatus />

        {/* Auth Form */}
        {isLogin ? (
          <Login onSwitchToRegister={() => setIsLogin(false)} />
        ) : (
          <Register onSwitchToLogin={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
};