import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { MovieCarousel } from "@/components/MovieCarousel";

// Import movie poster images
import strangerThings from "@/assets/stranger-things.jpg";
import witcher from "@/assets/witcher.jpg";
import ozark from "@/assets/ozark.jpg";
import wednesday from "@/assets/wednesday.jpg";
import moneyHeist from "@/assets/money-heist.jpg";
import theCrown from "@/assets/the-crown.jpg";

// Mock data for movies and series
const trendingMovies = [
  {
    id: "1",
    title: "Stranger Things",
    genre: "Sci-Fi, Thriller",
    year: 2024,
    rating: 8.7,
    duration: "4 saisons",
    image: strangerThings,
    isNew: true
  },
  {
    id: "2", 
    title: "The Witcher",
    genre: "Fantasy, Action",
    year: 2023,
    rating: 8.2,
    duration: "3 saisons",
    image: witcher,
    isNew: false
  },
  {
    id: "3",
    title: "Ozark", 
    genre: "Crime, Thriller",
    year: 2023,
    rating: 8.5,
    duration: "4 saisons",
    image: ozark,
    isNew: false
  },
  {
    id: "4",
    title: "Wednesday",
    genre: "Comedy, Horror",
    year: 2024,
    rating: 8.1,
    duration: "2 saisons",
    image: wednesday,
    isNew: true
  },
  {
    id: "5",
    title: "Money Heist",
    genre: "Crime, Drama",
    year: 2023,
    rating: 8.3,
    duration: "5 saisons",
    image: moneyHeist,
    isNew: false
  },
  {
    id: "6",
    title: "The Crown",
    genre: "Drama, History",
    year: 2023,
    rating: 8.6,
    duration: "6 saisons",
    image: theCrown,
    isNew: false
  }
];

const newReleases = [
  {
    id: "7",
    title: "Stranger Things",
    genre: "Sci-Fi, Thriller",
    year: 2024,
    rating: 8.7,
    duration: "4 saisons",
    image: strangerThings,
    isNew: true
  },
  {
    id: "8",
    title: "Wednesday",
    genre: "Comedy, Horror", 
    year: 2024,
    rating: 8.1,
    duration: "2 saisons",
    image: wednesday,
    isNew: true
  }
];

const popularSeries = [
  {
    id: "9",
    title: "The Witcher",
    genre: "Fantasy, Action",
    year: 2023, 
    rating: 8.2,
    duration: "3 saisons",
    image: witcher,
    isNew: false
  },
  {
    id: "10",
    title: "Ozark",
    genre: "Crime, Thriller",
    year: 2023,
    rating: 8.5,
    duration: "4 saisons", 
    image: ozark,
    isNew: false
  },
  {
    id: "11",
    title: "Money Heist",
    genre: "Crime, Drama",
    year: 2023,
    rating: 8.3,
    duration: "5 saisons",
    image: moneyHeist,
    isNew: false
  },
  {
    id: "12",
    title: "The Crown",
    genre: "Drama, History",
    year: 2023,
    rating: 8.6,
    duration: "6 saisons",
    image: theCrown,
    isNew: false
  }
];

const Index = () => {
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
            movies={trendingMovies}
            size="large"
          />
          
          <MovieCarousel 
            title="Nouveautés"
            movies={newReleases}
            size="medium"
          />
          
          <MovieCarousel 
            title="Séries populaires"
            movies={popularSeries}
            size="medium"
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
