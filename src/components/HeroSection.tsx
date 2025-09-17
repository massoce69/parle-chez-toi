import { Play, Plus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBanner from "@/assets/hero-banner.jpg";

export const HeroSection = () => {
  return (
    <section className="relative h-screen overflow-hidden">
      {/* Hero Background */}
      <div className="absolute inset-0">
        <img
          src={heroBanner}
          alt="Hero Banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 gradient-hero"></div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
        <div className="max-w-2xl space-y-6 animate-fadeInUp">
          {/* Badge */}
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/20 border border-primary/30">
            <span className="text-sm font-medium text-primary">Nouveau sur Massflix</span>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            Stranger
            <br />
            <span className="text-gradient">Things</span>
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-lg">
            Quand un jeune garçon disparaît, sa mère, un chef de la police et ses amis 
            doivent affronter des forces terrifiantes pour le retrouver.
          </p>

          {/* Metadata */}
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span className="px-2 py-1 bg-accent/20 text-accent rounded">16+</span>
            <span>2024</span>
            <span>4 saisons</span>
            <span>Sci-Fi, Thriller</span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="gradient-primary shadow-primary hover:shadow-glow transition-smooth">
              <Play className="w-5 h-5 mr-2" />
              Regarder maintenant
            </Button>
            <Button variant="secondary" size="lg" className="bg-secondary/80 hover:bg-secondary">
              <Plus className="w-5 h-5 mr-2" />
              Ma Liste
            </Button>
            <Button variant="ghost" size="lg" className="border border-border hover:bg-secondary/50">
              <Info className="w-5 h-5 mr-2" />
              Plus d'infos
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border border-foreground/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-foreground/50 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};