import { useEffect, useState } from 'react';
import { MovieCard } from '@/components/MovieCard';
import { Card, CardContent } from '@/components/ui/card';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Sparkles } from 'lucide-react';

interface RecommendationsSectionProps {
  contentId: string;
}

export const RecommendationsSection = ({ contentId }: RecommendationsSectionProps) => {
  const { getRecommendations } = useAnalytics();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true);
      try {
        const recs = await getRecommendations();
        setRecommendations(recs);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [getRecommendations]);

  const transformContent = (content: any[]) => {
    return content.map(item => ({
      id: item.id,
      title: item.title,
      genre: item.genres?.join(', ') || '',
      year: item.release_year || 2024,
      rating: item.average_rating || 0,
      duration: item.content_type === 'series' ? 
        `${Math.ceil((item.duration_minutes || 45) / 45)} saisons` : 
        `${item.duration_minutes || 120} min`,
      image: item.poster_url || '',
      isNew: item.is_new || false
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune recommandation</h3>
          <p className="text-muted-foreground">
            Regardez plus de contenu pour obtenir des recommandations personnalisées.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-semibold">Recommandé pour vous</h3>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
        {transformContent(recommendations).map(movie => (
          <MovieCard key={movie.id} {...movie} />
        ))}
      </div>
    </div>
  );
};