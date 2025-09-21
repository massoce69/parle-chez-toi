import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useAuth } from "./useLocalAuth";

// Types pour le contenu
export interface Content {
  id: number;
  title: string;
  description?: string;
  content_type: 'movie' | 'series';
  status: string;
  poster_url?: string;
  banner_url?: string;
  video_url?: string;
  trailer_url?: string;
  duration_minutes?: number;
  release_year?: number;
  genres: string[];
  cast_members: string[];
  director?: string;
  imdb_rating?: number;
  average_rating: number;
  view_count: number;
  is_featured: boolean;
  is_new: boolean;
  created_at: string;
  updated_at: string;
}

// Hook pour récupérer tout le contenu
export const useContent = (params: {
  type?: string;
  genre?: string;
  search?: string;
  limit?: number;
} = {}) => {
  return useQuery({
    queryKey: ['content', params],
    queryFn: () => apiClient.getContent(params),
  });
};

// Hook pour récupérer un contenu par ID
export const useContentById = (id: string) => {
  return useQuery({
    queryKey: ['content', id],
    queryFn: () => apiClient.getContentById(id),
    enabled: !!id,
  });
};

// Hook pour le contenu tendance
export const useTrendingContent = () => {
  return useQuery({
    queryKey: ['content', 'trending'],
    queryFn: () => apiClient.getTrendingContent(),
  });
};

// Hook pour les nouveautés
export const useNewReleases = () => {
  return useQuery({
    queryKey: ['content', 'new'],
    queryFn: () => apiClient.getNewReleases(),
  });
};

// Hook pour le contenu en vedette
export const useFeaturedContent = () => {
  return useQuery({
    queryKey: ['content', 'featured'],
    queryFn: () => apiClient.getFeaturedContent(),
  });
};

// Hook pour le contenu par type
export const useContentByType = (contentType: 'movie' | 'series') => {
  return useQuery({
    queryKey: ['content', 'type', contentType],
    queryFn: () => apiClient.getContent({ type: contentType }),
  });
};

// Hook pour rechercher du contenu
export const useSearchContent = (params: {
  query?: string;
  genre?: string;
  contentType?: string;
  year?: number;
}) => {
  return useQuery({
    queryKey: ['content', 'search', params],
    queryFn: () => apiClient.getContent({
      search: params.query,
      genre: params.genre,
      type: params.contentType,
    }),
    enabled: !!(params.query || params.genre || params.contentType),
  });
};

// Hook pour les favoris
export const useFavorites = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const favoritesQuery = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: () => apiClient.getFavorites(),
    enabled: !!user,
  });

  const addToFavoritesMutation = useMutation({
    mutationFn: (contentId: string) => apiClient.addToFavorites(contentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
    },
  });

  const removeFromFavoritesMutation = useMutation({
    mutationFn: (contentId: string) => apiClient.removeFromFavorites(contentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
    },
  });

  return {
    favorites: favoritesQuery.data || [],
    isLoading: favoritesQuery.isLoading,
    addToFavorites: addToFavoritesMutation.mutate,
    removeFromFavorites: removeFromFavoritesMutation.mutate,
  };
};

// Hook pour l'historique de visionnage
export const useWatchHistory = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const watchHistoryQuery = useQuery({
    queryKey: ['watch-history', user?.id],
    queryFn: () => apiClient.getWatchHistory(),
    enabled: !!user,
  });

  const addToHistoryMutation = useMutation({
    mutationFn: (params: { 
      contentId: string; 
      progressSeconds?: number; 
      completed?: boolean 
    }) => apiClient.addToWatchHistory(
      params.contentId, 
      params.progressSeconds, 
      params.completed
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watch-history', user?.id] });
    },
  });

  return {
    watchHistory: watchHistoryQuery.data || [],
    isLoading: watchHistoryQuery.isLoading,
    addToHistory: addToHistoryMutation.mutate,
    updateProgress: addToHistoryMutation.mutate, // Même fonction pour la mise à jour
  };
};

// For the local version, we'll add placeholder functions for useCategories and useContentReviews
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => Promise.resolve([]),
  });
};

export const useContentReviews = (contentId: string) => {
  return useQuery({
    queryKey: ['reviews', contentId],
    queryFn: () => Promise.resolve([]),
    enabled: !!contentId,
  });
};

export const useContentByGenre = (params: {
  genre?: string;
  contentType?: string;
}) => {
  return useQuery({
    queryKey: ['content', 'genre', params],
    queryFn: () => apiClient.getContent(params),
  });
};