import { useState } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MovieCard } from '@/components/MovieCard';
import { useContentByGenre, useCategories } from '@/hooks/useContent';
import { Film, Tv, Sparkles } from 'lucide-react';

const Categories = () => {
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedType, setSelectedType] = useState<'movie' | 'series' | ''>('');
  
  const { data: categories = [] } = useCategories();
  const { data: content = [], isLoading } = useContentByGenre({
    genre: selectedGenre,
    contentType: selectedType
  });

  const genres = [
    { id: 'Action', name: 'Action', icon: '🎬', color: 'bg-red-500' },
    { id: 'Comedy', name: 'Comédie', icon: '😄', color: 'bg-yellow-500' },
    { id: 'Drama', name: 'Drame', icon: '🎭', color: 'bg-blue-500' },
    { id: 'Horror', name: 'Horreur', icon: '👻', color: 'bg-purple-500' },
    { id: 'Romance', name: 'Romance', icon: '💕', color: 'bg-pink-500' },
    { id: 'Sci-Fi', name: 'Science-fiction', icon: '🚀', color: 'bg-cyan-500' },
    { id: 'Thriller', name: 'Thriller', icon: '⚡', color: 'bg-orange-500' },
    { id: 'Adventure', name: 'Aventure', icon: '🗺️', color: 'bg-green-500' }
  ];

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gradient mb-4">Explorer par catégories</h1>
            <p className="text-muted-foreground">Découvrez votre contenu préféré par genre</p>
          </div>

          {/* Type Filters */}
          <div className="flex justify-center gap-4">
            <Button
              variant={selectedType === '' ? 'default' : 'outline'}
              onClick={() => setSelectedType('')}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Tout
            </Button>
            <Button
              variant={selectedType === 'movie' ? 'default' : 'outline'}
              onClick={() => setSelectedType('movie')}
              className="gap-2"
            >
              <Film className="h-4 w-4" />
              Films
            </Button>
            <Button
              variant={selectedType === 'series' ? 'default' : 'outline'}
              onClick={() => setSelectedType('series')}
              className="gap-2"
            >
              <Tv className="h-4 w-4" />
              Séries
            </Button>
          </div>

          {/* Genre Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {genres.map(genre => (
              <Card
                key={genre.id}
                className={`cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${
                  selectedGenre === genre.id ? 'ring-2 ring-primary shadow-primary' : ''
                }`}
                onClick={() => setSelectedGenre(selectedGenre === genre.id ? '' : genre.id)}
              >
                <CardContent className="p-6 text-center space-y-4">
                  <div className={`w-16 h-16 rounded-full ${genre.color} flex items-center justify-center text-2xl mx-auto`}>
                    {genre.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{genre.name}</h3>
                    <Badge variant="secondary" className="mt-2">
                      {genre.id}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Content Results */}
          {selectedGenre && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">
                  {genres.find(g => g.id === selectedGenre)?.name}
                  {selectedType && (
                    <span className="text-muted-foreground ml-2">
                      - {selectedType === 'movie' ? 'Films' : 'Séries'}
                    </span>
                  )}
                </h2>
                <Badge variant="outline">{content.length} résultats</Badge>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
                </div>
              ) : content.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                  {transformContent(content).map(movie => (
                    <MovieCard key={movie.id} {...movie} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <div className="text-4xl mb-4">🎬</div>
                    <h3 className="text-lg font-semibold mb-2">Aucun contenu trouvé</h3>
                    <p className="text-muted-foreground">
                      Aucun {selectedType === 'movie' ? 'film' : selectedType === 'series' ? 'série' : 'contenu'} 
                      {' '}disponible dans cette catégorie pour le moment.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {!selectedGenre && (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-lg font-semibold mb-2">Choisissez une catégorie</h3>
                <p className="text-muted-foreground">
                  Sélectionnez un genre ci-dessus pour découvrir le contenu disponible.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Categories;