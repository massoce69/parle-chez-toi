import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useWatchHistory = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const watchHistoryQuery = useQuery({
    queryKey: ["watch-history", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("watch_history")
        .select(`
          *,
          content (*)
        `)
        .eq("user_id", user!.id)
        .order("watched_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const addToHistoryMutation = useMutation({
    mutationFn: async (params: { 
      contentId: string; 
      progressSeconds?: number; 
      completed?: boolean 
    }) => {
      const { error } = await supabase
        .from("watch_history")
        .upsert({
          user_id: user!.id,
          content_id: params.contentId,
          progress_seconds: params.progressSeconds || 0,
          completed: params.completed || false,
          watched_at: new Date().toISOString(),
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watch-history", user?.id] });
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: async (params: { 
      contentId: string; 
      progressSeconds: number; 
      completed?: boolean 
    }) => {
      const { error } = await supabase
        .from("watch_history")
        .upsert({
          user_id: user!.id,
          content_id: params.contentId,
          progress_seconds: params.progressSeconds,
          completed: params.completed || false,
          watched_at: new Date().toISOString(),
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watch-history", user?.id] });
    },
  });

  return {
    watchHistory: watchHistoryQuery.data || [],
    isLoading: watchHistoryQuery.isLoading,
    addToHistory: addToHistoryMutation.mutate,
    updateProgress: updateProgressMutation.mutate,
  };
};