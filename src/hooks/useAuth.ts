import { useState, useEffect, createContext, useContext } from 'react';

interface User {
  id: string;
  email: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, username: string, password: string) => Promise<boolean>;
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
    // Check for existing token on mount
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
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simple validation
    if (email && password.length >= 6) {
      const mockUser: User = {
        id: '1',
        email,
        username: email.split('@')[0],
      };
      
      const mockToken = 'steam_token_' + Date.now();
      
      localStorage.setItem('steam_token', mockToken);
      localStorage.setItem('steam_user', JSON.stringify(mockUser));
      setUser(mockUser);
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const register = async (email: string, username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simple validation
    if (email && username && password.length >= 6) {
      const mockUser: User = {
        id: '1',
        email,
        username,
      };
      
      const mockToken = 'steam_token_' + Date.now();
      
      localStorage.setItem('steam_token', mockToken);
      localStorage.setItem('steam_user', JSON.stringify(mockUser));
      setUser(mockUser);
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    localStorage.removeItem('steam_token');
    localStorage.removeItem('steam_user');
    setUser(null);
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