import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useAnalytics = () => {
  const { user } = useAuth();
  
  const incrementView = async (contentId: string) => {
    if (!contentId) return;
    
    try {
      const { error } = await supabase.functions.invoke('content-analytics', {
        body: {
          action: 'increment_view',
          content_id: contentId,
          user_id: user?.id
        }
      });
      
      if (error) {
        console.error('Error incrementing view:', error);
      }
    } catch (error) {
      console.error('Error calling analytics function:', error);
    }
  };

  const getRecommendations = async () => {
    if (!user?.id) return [];
    
    try {
      const { data, error } = await supabase.functions.invoke('content-analytics', {
        body: {
          action: 'get_recommendations',
          user_id: user.id
        }
      });
      
      if (error) {
        console.error('Error getting recommendations:', error);
        return [];
      }
      
      return data?.recommendations || [];
    } catch (error) {
      console.error('Error calling recommendations function:', error);
      return [];
    }
  };

  return {
    incrementView,
    getRecommendations
  };
};

// Existing hooks (keep them for backward compatibility)
import { useMutation, useQuery } from '@tanstack/react-query';

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