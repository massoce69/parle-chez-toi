import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Hook to increment view count
export const useIncrementView = () => {
  return useMutation({
    mutationFn: async ({ contentId, userId }: { contentId: string; userId?: string }) => {
      const { data, error } = await supabase.functions.invoke('content-analytics', {
        body: {
          action: 'increment_view',
          content_id: contentId,
          user_id: userId,
        },
      });

      if (error) throw error;
      return data;
    },
  });
};

// Hook to get personalized recommendations
export const useRecommendations = (userId?: string) => {
  return useQuery({
    queryKey: ['recommendations', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase.functions.invoke('content-analytics', {
        body: {
          action: 'get_recommendations',
          user_id: userId,
        },
      });

      if (error) throw error;
      return data?.recommendations || [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to track viewing analytics
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