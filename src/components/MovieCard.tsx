import { useState } from "react";
import { Play, Plus, Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MovieCardProps {
  title: string;
  genre: string;
  year: number;
  rating: number;
  duration?: string;
  image: string;
  isNew?: boolean;
  size?: "small" | "medium" | "large";
}

export const MovieCard = ({ 
  title, 
  genre, 
  year, 
  rating, 
  duration, 
  image, 
  isNew = false,
  size = "medium" 
}: MovieCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const sizeClasses = {
    small: "w-48 h-72",
    medium: "w-64 h-96", 
    large: "w-80 h-[450px]"
  };

  return (
    <div 
      className={`relative ${sizeClasses[size]} rounded-xl overflow-hidden transition-smooth cursor-pointer group ${
        isHovered ? 'scale-105 z-10' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Movie Poster */}
      <div className="absolute inset-0">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-smooth"></div>
      </div>

      {/* New Badge */}
      {isNew && (
        <div className="absolute top-3 left-3 px-2 py-1 bg-primary rounded-md z-20">
          <span className="text-xs font-semibold text-primary-foreground">NOUVEAU</span>
        </div>
      )}

      {/* Rating Badge */}
      <div className="absolute top-3 right-3 flex items-center space-x-1 px-2 py-1 bg-black/70 rounded-md z-20">
        <Star className="w-3 h-3 text-accent fill-accent" />
        <span className="text-xs font-medium text-foreground">{rating}</span>
      </div>

      {/* Hover Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent transition-smooth ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
          {/* Title & Info */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-1">{title}</h3>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>{year}</span>
              {duration && (
                <>
                  <span>•</span>
                  <span>{duration}</span>
                </>
              )}
              <span>•</span>
              <span>{genre}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <Button size="sm" className="gradient-primary shadow-primary">
              <Play className="w-4 h-4 mr-1" />
              Play
            </Button>
            <Button variant="secondary" size="sm" className="bg-secondary/80">
              <Plus className="w-4 h-4" />
            </Button>
            <Button variant="secondary" size="sm" className="bg-secondary/80">
              <Heart className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};