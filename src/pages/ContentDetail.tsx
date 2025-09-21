import { useParams, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useContentById, useContentReviews } from '@/hooks/useContent';
import { useFavorites } from '@/hooks/useFavorites';
import { VideoPlayer } from '@/components/VideoPlayer';
import { ReviewSection } from '@/components/ReviewSection';
import { RecommendationsSection } from '@/components/RecommendationsSection';
import { Play, Plus, Check, Star, Calendar, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const ContentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [showPlayer, setShowPlayer] = useState(false);
  
  const { data: content, isLoading } = useContentById(id!);
  const { data: reviews = [] } = useContentReviews(id!);
  const { favorites, addToFavorites, removeFromFavorites } = useFavorites();

  if (!id) {
    return <Navigate to="/search" replace />;
  }

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

  if (!content) {
    return <Navigate to="/search" replace />;
  }

  const isFavorite = favorites.some(fav => fav.content_id === content.id);

  const handleToggleFavorite = () => {
    if (isFavorite) {
      removeFromFavorites(content.id);
    } else {
      addToFavorites(content.id);
    }
  };

  if (showPlayer && content.video_url) {
    return (
      <VideoPlayer
        videoUrl={content.video_url}
        title={content.title}
        onClose={() => setShowPlayer(false)}
        contentId={content.id}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <div className="relative h-[70vh] overflow-hidden">
        <img 
          src={content.banner_url || content.poster_url} 
          alt={content.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 gradient-hero" />
        
        <div className="absolute bottom-0 left-0 right-0 p-8 container mx-auto">
          <div className="max-w-3xl space-y-6">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold text-white">{content.title}</h1>
              
              <div className="flex flex-wrap items-center gap-4 text-white/80">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{content.average_rating?.toFixed(1) || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{content.release_year}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {content.content_type === 'series' ? 
                      `${Math.ceil((content.duration_minutes || 45) / 45)} saisons` : 
                      `${content.duration_minutes || 120} min`
                    }
                  </span>
                </div>
                <Badge variant="secondary">{content.age_rating || 'Tout public'}</Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                {content.genres?.map(genre => (
                  <Badge key={genre} variant="outline" className="text-white border-white/30">
                    {genre}
                  </Badge>
                ))}
              </div>

              <p className="text-lg text-white/90 max-w-2xl">{content.description}</p>
            </div>

            <div className="flex gap-4">
              {content.video_url && (
                <Button 
                  size="lg" 
                  className="gradient-primary gap-2"
                  onClick={() => setShowPlayer(true)}
                >
                  <Play className="h-5 w-5" />
                  Regarder maintenant
                </Button>
              )}
              
              {content.trailer_url && (
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="text-white border-white/30 hover:bg-white/10"
                  onClick={() => window.open(content.trailer_url, '_blank')}
                >
                  Bande-annonce
                </Button>
              )}

              <Button 
                variant="outline" 
                size="lg"
                className="text-white border-white/30 hover:bg-white/10"
                onClick={handleToggleFavorite}
              >
                {isFavorite ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Plus className="h-5 w-5" />
                )}
                {isFavorite ? 'Dans ma liste' : 'Ajouter à ma liste'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="details" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 max-w-md mx-auto">
            <TabsTrigger value="details">Détails</TabsTrigger>
            <TabsTrigger value="cast">Distribution</TabsTrigger>
            <TabsTrigger value="reviews">Avis ({reviews.length})</TabsTrigger>
            <TabsTrigger value="similar">Similaires</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>À propos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Synopsis</h4>
                  <p className="text-muted-foreground">{content.description}</p>
                </div>
                
                {content.director && (
                  <div>
                    <h4 className="font-semibold mb-2">Réalisateur</h4>
                    <p className="text-muted-foreground">{content.director}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold mb-2">Genres</h4>
                  <div className="flex flex-wrap gap-2">
                    {content.genres?.map(genre => (
                      <Badge key={genre} variant="secondary">{genre}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cast" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {content.cast_members && content.cast_members.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {content.cast_members.map((actor, index) => (
                      <div key={index} className="text-center space-y-2">
                        <div className="w-20 h-20 bg-muted rounded-full mx-auto flex items-center justify-center">
                          <span className="text-2xl font-bold text-muted-foreground">
                            {actor.charAt(0)}
                          </span>
                        </div>
                        <p className="font-medium">{actor}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Aucune information sur la distribution disponible.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <ReviewSection contentId={content.id} reviews={reviews as any} />
          </TabsContent>

          <TabsContent value="similar" className="space-y-6">
            <RecommendationsSection contentId={content.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ContentDetail;