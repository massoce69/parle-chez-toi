-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE content_type AS ENUM ('movie', 'series');
CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');

-- Create profiles table for extended user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  subscription_plan TEXT DEFAULT 'free',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT profiles_user_id_unique UNIQUE (user_id)
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create content table (movies and series)
CREATE TABLE public.content (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  content_type content_type NOT NULL,
  status content_status NOT NULL DEFAULT 'draft',
  poster_url TEXT,
  banner_url TEXT,
  trailer_url TEXT,
  video_url TEXT,
  duration_minutes INTEGER,
  release_year INTEGER,
  age_rating TEXT,
  director TEXT,
  cast_members TEXT[],
  genres TEXT[],
  is_featured BOOLEAN DEFAULT false,
  is_new BOOLEAN DEFAULT false,
  average_rating DECIMAL(3,1) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create content_categories junction table
CREATE TABLE public.content_categories (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT content_categories_unique UNIQUE (content_id, category_id)
);

-- Create user_favorites table
CREATE TABLE public.user_favorites (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT user_favorites_unique UNIQUE (user_id, content_id)
);

-- Create watch_history table
CREATE TABLE public.watch_history (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  watched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  progress_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  CONSTRAINT watch_history_unique UNIQUE (user_id, content_id)
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT reviews_unique UNIQUE (user_id, content_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for categories (public read)
CREATE POLICY "Categories are viewable by everyone" 
ON public.categories FOR SELECT 
USING (true);

-- RLS Policies for content (public read for published content)
CREATE POLICY "Published content is viewable by everyone" 
ON public.content FOR SELECT 
USING (status = 'published');

-- RLS Policies for content_categories (public read)
CREATE POLICY "Content categories are viewable by everyone" 
ON public.content_categories FOR SELECT 
USING (true);

-- RLS Policies for user_favorites
CREATE POLICY "Users can view their own favorites" 
ON public.user_favorites FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" 
ON public.user_favorites FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" 
ON public.user_favorites FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for watch_history
CREATE POLICY "Users can view their own watch history" 
ON public.watch_history FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own watch history" 
ON public.watch_history FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watch history" 
ON public.watch_history FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for reviews
CREATE POLICY "Reviews are viewable by everyone" 
ON public.reviews FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own reviews" 
ON public.reviews FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" 
ON public.reviews FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" 
ON public.reviews FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_content_status ON public.content(status);
CREATE INDEX idx_content_type ON public.content(content_type);
CREATE INDEX idx_content_featured ON public.content(is_featured);
CREATE INDEX idx_content_new ON public.content(is_new);
CREATE INDEX idx_content_rating ON public.content(average_rating);
CREATE INDEX idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX idx_user_favorites_content_id ON public.user_favorites(content_id);
CREATE INDEX idx_watch_history_user_id ON public.watch_history(user_id);
CREATE INDEX idx_watch_history_content_id ON public.watch_history(content_id);
CREATE INDEX idx_reviews_content_id ON public.reviews(content_id);
CREATE INDEX idx_reviews_rating ON public.reviews(rating);

-- Function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, full_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update content rating
CREATE OR REPLACE FUNCTION public.update_content_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.content 
  SET 
    average_rating = (
      SELECT ROUND(AVG(rating::DECIMAL), 1)
      FROM public.reviews 
      WHERE content_id = COALESCE(NEW.content_id, OLD.content_id)
    ),
    total_ratings = (
      SELECT COUNT(*)
      FROM public.reviews 
      WHERE content_id = COALESCE(NEW.content_id, OLD.content_id)
    )
  WHERE id = COALESCE(NEW.content_id, OLD.content_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger to update content rating when reviews change
CREATE TRIGGER update_content_rating_on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_content_rating();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_updated_at
  BEFORE UPDATE ON public.content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample categories
INSERT INTO public.categories (name, slug, description) VALUES
  ('Action', 'action', 'Films et séries d''action palpitants'),
  ('Drame', 'drame', 'Histoires dramatiques et émotionnelles'),
  ('Comédie', 'comedie', 'Films et séries comiques'),
  ('Thriller', 'thriller', 'Suspense et tension garantis'),
  ('Sci-Fi', 'sci-fi', 'Science-fiction et futurisme'),
  ('Fantastique', 'fantastique', 'Mondes imaginaires et magie'),
  ('Horreur', 'horreur', 'Frissons et épouvante'),
  ('Romance', 'romance', 'Histoires d''amour touchantes'),
  ('Crime', 'crime', 'Polars et enquêtes criminelles'),
  ('Documentaire', 'documentaire', 'Documentaires informatifs');

-- Insert sample content (matching the existing mock data structure)
INSERT INTO public.content (title, slug, description, content_type, status, poster_url, banner_url, duration_minutes, release_year, age_rating, genres, is_featured, is_new, average_rating) VALUES
  (
    'Stranger Things',
    'stranger-things',
    'Quand un jeune garçon disparaît, sa mère, un chef de la police et ses amis doivent affronter des forces terrifiantes pour le retrouver.',
    'series',
    'published',
    '/src/assets/stranger-things.jpg',
    '/src/assets/hero-banner.jpg',
    45,
    2024,
    '16+',
    ARRAY['Sci-Fi', 'Thriller'],
    true,
    true,
    8.7
  ),
  (
    'The Witcher',
    'the-witcher',
    'Geralt de Riv, un chasseur de monstres solitaire, lutte pour trouver sa place dans un monde où les humains sont souvent plus vicieux que les bêtes.',
    'series',
    'published',
    '/src/assets/witcher.jpg',
    NULL,
    60,
    2023,
    '16+',
    ARRAY['Fantasy', 'Action'],
    false,
    false,
    8.2
  ),
  (
    'Ozark',
    'ozark',
    'Un conseiller financier entraîne sa famille du Chicago vers les Ozarks du Missouri, où il doit blanchir 500 millions de dollars en cinq ans pour apaiser un baron de la drogue.',
    'series',
    'published',
    '/src/assets/ozark.jpg',
    NULL,
    50,
    2023,
    '18+',
    ARRAY['Crime', 'Thriller'],
    false,
    false,
    8.5
  ),
  (
    'Wednesday',
    'wednesday',
    'Wednesday Addams enquête sur une série de meurtres tout en naviguant dans ses nouvelles relations à l''académie Nevermore.',
    'series',
    'published',
    '/src/assets/wednesday.jpg',
    NULL,
    45,
    2024,
    '13+',
    ARRAY['Comedy', 'Horror'],
    false,
    true,
    8.1
  ),
  (
    'Money Heist',
    'money-heist',
    'Un mystérieux homme appelé le Professeur planifie le plus grand braquage de l''histoire pour imprimer des milliards d''euros à la Monnaie royale d''Espagne.',
    'series',
    'published',
    '/src/assets/money-heist.jpg',
    NULL,
    70,
    2023,
    '16+',
    ARRAY['Crime', 'Drama'],
    false,
    false,
    8.3
  ),
  (
    'The Crown',
    'the-crown',
    'Cette série suit la vie politique rivalités, romances et intrigues du règne de la reine Elizabeth II et les événements qui ont façonné la seconde moitié du 20ème siècle.',
    'series',
    'published',
    '/src/assets/the-crown.jpg',
    NULL,
    60,
    2023,
    '13+',
    ARRAY['Drama', 'History'],
    false,
    false,
    8.6
  );