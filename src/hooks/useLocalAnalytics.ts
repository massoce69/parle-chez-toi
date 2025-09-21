import { useAuth } from "./useLocalAuth";
import { apiClient } from "@/lib/api";
import { useMutation, useQuery } from '@tanstack/react-query';

export const useAnalytics = () => {
  const { user } = useAuth();
  
  const incrementView = async (contentId: string) => {
    if (!contentId || !user) return;
    
    try {
      // Dans la version locale, on peut simplement incrémenter via l'API
      await apiClient.addToWatchHistory(contentId);
    } catch (error) {
      console.error('Error incrementing view:', error);
    }
  };

  const getRecommendations = async () => {
    if (!user?.id) return [];
    
    try {
      // Pour la version locale, on retourne du contenu populaire comme recommandations
      const content = await apiClient.getTrendingContent();
      return content || [];
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  };

  return {
    incrementView,
    getRecommendations
  };
};

export const useIncrementView = () => {
  const { incrementView } = useAnalytics();
  
  return useMutation({
    mutationFn: async ({ contentId }: { contentId: string; userId?: string }) => {
      await incrementView(contentId);
    },
  });
};

export const useRecommendations = (userId?: string) => {
  const { getRecommendations } = useAnalytics();
  
  return useQuery({
    queryKey: ['recommendations', userId],
    queryFn: getRecommendations,
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useViewingAnalytics = () => {
  const incrementView = useIncrementView();

  const trackView = (contentId: string, userId?: string) => {
    incrementView.mutate({ contentId, userId });
  };

  return {
    trackView,
    isTracking: incrementView.isPending,
  };
};