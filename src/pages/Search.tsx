import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MovieCard } from '@/components/MovieCard';
import { useSearchContent } from '@/hooks/useContent';
import { Search as SearchIcon, Filter } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [genre, setGenre] = useState(searchParams.get('genre') || '');
  const [year, setYear] = useState(searchParams.get('year') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  
  const { data: searchResults = [], isLoading } = useSearchContent({
    query,
    genre,
    year: year ? parseInt(year) : undefined,
    contentType: type as 'movie' | 'series' | undefined
  });

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (genre) params.set('genre', genre);
    if (year) params.set('year', year);
    if (type) params.set('type', type);
    setSearchParams(params);
  }, [query, genre, year, type, setSearchParams]);

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
            <h1 className="text-4xl font-bold text-gradient mb-4">Rechercher</h1>
            <p className="text-muted-foreground">Trouvez vos films et séries préférés</p>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                placeholder="Rechercher un titre, acteur, réalisateur..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-12 h-14 text-lg"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filtres :</span>
              </div>
              
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous</SelectItem>
                  <SelectItem value="movie">Films</SelectItem>
                  <SelectItem value="series">Séries</SelectItem>
                </SelectContent>
              </Select>

              <Select value={genre} onValueChange={setGenre}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous</SelectItem>
                  <SelectItem value="Action">Action</SelectItem>
                  <SelectItem value="Comedy">Comédie</SelectItem>
                  <SelectItem value="Drama">Drame</SelectItem>
                  <SelectItem value="Horror">Horreur</SelectItem>
                  <SelectItem value="Romance">Romance</SelectItem>
                  <SelectItem value="Sci-Fi">Science-fiction</SelectItem>
                  <SelectItem value="Thriller">Thriller</SelectItem>
                </SelectContent>
              </Select>

              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Année" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                  <SelectItem value="2021">2021</SelectItem>
                  <SelectItem value="2020">2020</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={() => {
                  setQuery('');
                  setGenre('');
                  setYear('');
                  setType('');
                }}
              >
                Effacer
              </Button>
            </div>
          </div>

          {/* Results */}
          <div>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
              </div>
            ) : query || genre || year || type ? (
              <div>
                <h2 className="text-2xl font-semibold mb-6">
                  Résultats ({searchResults.length})
                </h2>
                {searchResults.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                    {transformContent(searchResults).map(movie => (
                      <MovieCard key={movie.id} {...movie} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">Aucun résultat trouvé</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">Commencez à taper pour rechercher</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Search;