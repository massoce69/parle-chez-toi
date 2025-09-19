import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Content {
  id: string;
  title: string;
  slug: string;
  description?: string;
  content_type: 'movie' | 'series';
  status: 'draft' | 'published' | 'archived';
  poster_url?: string;
  banner_url?: string;
  trailer_url?: string;
  video_url?: string;
  duration_minutes?: number;
  release_year?: number;
  age_rating?: string;
  director?: string;
  cast_members?: string[];
  genres?: string[];
  is_featured: boolean;
  is_new: boolean;
  average_rating: number;
  total_ratings: number;
  view_count: number;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface UserFavorite {
  id: string;
  user_id: string;
  content_id: string;
  created_at: string;
}

export interface WatchHistory {
  id: string;
  user_id: string;
  content_id: string;
  watched_at: string;
  progress_seconds: number;
  completed: boolean;
}

// Get all published content
export const useContent = () => {
  return useQuery({
    queryKey: ['content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Content[];
    },
  });
};

// Get featured content
export const useFeaturedContent = () => {
  return useQuery({
    queryKey: ['content', 'featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('status', 'published')
        .eq('is_featured', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Content[];
    },
  });
};

// Get new releases
export const useNewReleases = () => {
  return useQuery({
    queryKey: ['content', 'new'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('status', 'published')
        .eq('is_new', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Content[];
    },
  });
};

// Get content by type
export const useContentByType = (contentType: 'movie' | 'series') => {
  return useQuery({
    queryKey: ['content', 'type', contentType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('status', 'published')
        .eq('content_type', contentType)
        .order('average_rating', { ascending: false });
      
      if (error) throw error;
      return data as Content[];
    },
  });
};

// Get trending content (by view count)
export const useTrendingContent = () => {
  return useQuery({
    queryKey: ['content', 'trending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('status', 'published')
        .order('view_count', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as Content[];
    },
  });
};

// Get user favorites
export const useUserFavorites = (userId?: string) => {
  return useQuery({
    queryKey: ['favorites', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          *,
          content:content_id(*)
        `)
        .eq('user_id', userId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

// Get user watch history
export const useWatchHistory = (userId?: string) => {
  return useQuery({
    queryKey: ['watch_history', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('watch_history')
        .select(`
          *,
          content:content_id(*)
        `)
        .eq('user_id', userId)
        .order('watched_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

// Add to favorites
export const useAddToFavorites = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ contentId, userId }: { contentId: string; userId: string }) => {
      const { data, error } = await supabase
        .from('user_favorites')
        .insert([{ content_id: contentId, user_id: userId }]);
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] });
    },
  });
};

// Remove from favorites
export const useRemoveFromFavorites = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ contentId, userId }: { contentId: string; userId: string }) => {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('content_id', contentId)
        .eq('user_id', userId);
      
      if (error) throw error;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] });
    },
  });
};

// Add to watch history
export const useAddToWatchHistory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      contentId, 
      userId, 
      progressSeconds = 0, 
      completed = false 
    }: { 
      contentId: string; 
      userId: string; 
      progressSeconds?: number; 
      completed?: boolean; 
    }) => {
      const { data, error } = await supabase
        .from('watch_history')
        .upsert([{ 
          content_id: contentId, 
          user_id: userId,
          progress_seconds: progressSeconds,
          completed,
          watched_at: new Date().toISOString()
        }]);
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['watch_history', userId] });
    },
  });
};