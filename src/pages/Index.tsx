import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { MovieCarousel } from "@/components/MovieCarousel";
import { useTrendingContent, useNewReleases, useContentByType } from "@/hooks/useContent";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user } = useAuth();
  const { data: trendingMovies = [], isLoading: loadingTrending } = useTrendingContent();
  const { data: newReleases = [], isLoading: loadingNew } = useNewReleases();  
  const { data: popularSeries = [], isLoading: loadingSeries } = useContentByType('series');

  // Transform database data to match MovieCard interface
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

  const isLoading = loadingTrending || loadingNew || loadingSeries;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <HeroSection />

        {/* Content Sections */}
        <div className="space-y-12 py-12">
          <MovieCarousel 
            title="Tendances actuelles"
            movies={transformContent(trendingMovies)}
            size="large"
          />
          
          <MovieCarousel 
            title="Nouveautés"
            movies={transformContent(newReleases)}
            size="medium"
          />
          
          <MovieCarousel 
            title="Séries populaires"
            movies={transformContent(popularSeries)}
            size="medium"
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
