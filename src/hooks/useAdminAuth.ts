import { useAuth } from '@/hooks/useLocalAuth';
import { useProfile } from '@/hooks/useLocalProfile';

export const useAdminAuth = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();

  const isAdmin = profile?.role === 'admin';
  const isModerator = profile?.role === 'moderator';
  const hasAdminAccess = isAdmin || isModerator;
  const loading = authLoading || profileLoading;

  return {
    user,
    profile,
    isAdmin,
    isModerator,
    hasAdminAccess,
    loading,
    role: profile?.role || 'user' as const
  };
};