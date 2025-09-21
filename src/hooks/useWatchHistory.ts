import { useWatchHistory as useLocalWatchHistory } from "@/hooks/useLocalContent";

export const useWatchHistory = () => {
  const { watchHistory, isLoading, addToHistory, updateProgress } = useLocalWatchHistory();
  return { watchHistory, isLoading, addToHistory, updateProgress };
};