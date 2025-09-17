import { useState } from "react";
import { Search, Bell, User, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border transition-smooth">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-8">
          <h1 className="text-2xl font-bold text-gradient">Massflix</h1>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Button variant="ghost" className="text-foreground hover:text-primary">
              Accueil
            </Button>
            <Button variant="ghost" className="text-foreground hover:text-primary">
              Films
            </Button>
            <Button variant="ghost" className="text-foreground hover:text-primary">
              Séries
            </Button>
            <Button variant="ghost" className="text-foreground hover:text-primary">
              Ma Liste
            </Button>
          </nav>
        </div>

        {/* Search & User Actions */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="hidden sm:flex items-center relative">
            <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64 bg-secondary/50 border-border focus:border-primary"
            />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></span>
          </Button>

          {/* Profile */}
          <Button variant="ghost" size="icon">
            <User className="w-5 h-5" />
          </Button>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-lg border-b border-border animate-fadeInUp">
          <nav className="container mx-auto px-4 py-4 space-y-4">
            <div className="flex items-center relative mb-4">
              <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full bg-secondary/50 border-border focus:border-primary"
              />
            </div>
            <Button variant="ghost" className="w-full justify-start text-foreground hover:text-primary">
              Accueil
            </Button>
            <Button variant="ghost" className="w-full justify-start text-foreground hover:text-primary">
              Films
            </Button>
            <Button variant="ghost" className="w-full justify-start text-foreground hover:text-primary">
              Séries
            </Button>
            <Button variant="ghost" className="w-full justify-start text-foreground hover:text-primary">
              Ma Liste
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};