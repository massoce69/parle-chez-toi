import { useFavorites as useLocalFavorites, useWatchHistory } from "@/hooks/useLocalContent";

export const useFavorites = () => {
  const { favorites, isLoading, addToFavorites, removeFromFavorites } = useLocalFavorites();
  return { favorites, isLoading, addToFavorites, removeFromFavorites };
};