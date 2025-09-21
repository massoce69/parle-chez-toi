import { useState, useEffect, createContext, useContext } from 'react';
import { apiClient } from '@/lib/api';

interface User {
  id: number;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  role: string;
  subscription_plan: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error?: any }>;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté au démarrage
    const token = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Erreur lors du parsing de l\'utilisateur:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string, metadata: any = {}) => {
    try {
      const response = await apiClient.register(
        email,
        password,
        metadata.username,
        metadata.fullName
      );
      
      setUser(response.user);
      return {};
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      return { error: error instanceof Error ? error.message : 'Erreur d\'inscription' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password);
      setUser(response.user);
      return {};
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return { error: error instanceof Error ? error.message : 'Erreur de connexion' };
    }
  };

  const signOut = () => {
    apiClient.logout();
    setUser(null);
  };

  return {
    user,
    session: user ? { user } : null, // Compatibilité avec l'ancienne interface
    loading,
    signUp,
    signIn,
    signOut,
  };
};

export { AuthContext };