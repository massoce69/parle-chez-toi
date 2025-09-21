import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useLocalAuth";
import { apiClient } from "@/lib/api";

interface Profile {
  id: number;
  user_id: number;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  subscription_plan: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user } = useAuth();

  const profileQuery = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async (): Promise<Profile | null> => {
      if (!user) return null;
      
      // Pour la version locale, les données du profil sont dans l'utilisateur
      return {
        id: user.id,
        user_id: user.id,
        username: user.username,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        subscription_plan: user.subscription_plan || 'free',
        role: user.role || 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    },
    enabled: !!user,
  });

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
  };
};