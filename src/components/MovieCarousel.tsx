import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MovieCard } from "./MovieCard";

interface Movie {
  id: string;
  title: string;
  genre: string;
  year: number;
  rating: number;
  duration?: string;
  image: string;
  isNew?: boolean;
}

interface MovieCarouselProps {
  title: string;
  movies: Movie[];
  size?: "small" | "medium" | "large";
}

export const MovieCarousel = ({ title, movies, size = "medium" }: MovieCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const cardWidth = size === "small" ? 192 : size === "medium" ? 256 : 320;
  const gap = 16;
  const visibleCards = Math.floor((window.innerWidth - 64) / (cardWidth + gap));

  const canScrollLeft = currentIndex > 0;
  const canScrollRight = currentIndex < movies.length - visibleCards;

  const scrollLeft = () => {
    if (canScrollLeft) {
      const newIndex = Math.max(currentIndex - visibleCards, 0);
      setCurrentIndex(newIndex);
      scrollToIndex(newIndex);
    }
  };

  const scrollRight = () => {
    if (canScrollRight) {
      const newIndex = Math.min(currentIndex + visibleCards, movies.length - visibleCards);
      setCurrentIndex(newIndex);
      scrollToIndex(newIndex);
    }
  };

  const scrollToIndex = (index: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: index * (cardWidth + gap),
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between px-4">
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={scrollLeft}
            disabled={!canScrollLeft}
            className="rounded-full bg-secondary/50 hover:bg-secondary disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={scrollRight}
            disabled={!canScrollRight}
            className="rounded-full bg-secondary/50 hover:bg-secondary disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex space-x-4 px-4 overflow-x-auto scroll-hide"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {movies.map((movie) => (
            <div key={movie.id} className="flex-shrink-0" style={{ scrollSnapAlign: 'start' }}>
              <MovieCard
                title={movie.title}
                genre={movie.genre}
                year={movie.year}
                rating={movie.rating}
                duration={movie.duration}
                image={movie.image}
                isNew={movie.isNew}
                size={size}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};