-- ==========================================
-- CORRECTIONS DE SÉCURITÉ - VERSION CORRIGÉE
-- ==========================================

-- 1. Vérifier et corriger les politiques RLS existantes
-- Supprimer toutes les anciennes politiques et recréer proprement

-- CATEGORIES
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can view categories" ON public.categories;
CREATE POLICY "Authenticated users can view categories" 
ON public.categories 
FOR SELECT 
TO authenticated
USING (true);

-- CONTENT
DROP POLICY IF EXISTS "Published content is viewable by everyone" ON public.content;
DROP POLICY IF EXISTS "Authenticated users can view published content" ON public.content;
CREATE POLICY "Authenticated users can view published content" 
ON public.content 
FOR SELECT 
TO authenticated
USING (status = 'published'::content_status);

-- CONTENT_CATEGORIES
DROP POLICY IF EXISTS "Content categories are viewable by everyone" ON public.content_categories;
DROP POLICY IF EXISTS "Authenticated users can view content categories" ON public.content_categories;
CREATE POLICY "Authenticated users can view content categories" 
ON public.content_categories 
FOR SELECT 
TO authenticated
USING (true);

-- REVIEWS
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can view reviews" ON public.reviews;
CREATE POLICY "Authenticated users can view reviews" 
ON public.reviews 
FOR SELECT 
TO authenticated
USING (true);

-- 2. Sécuriser les profils
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own complete profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view public profile info of others" ON public.profiles;

-- Seuls les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view their own profile only" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- 3. Ajouter des contraintes de sécurité
-- Empêcher les ratings invalides
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'reviews_rating_range') THEN
        ALTER TABLE public.reviews 
        ADD CONSTRAINT reviews_rating_range 
        CHECK (rating >= 1 AND rating <= 5);
    END IF;
END $$;

-- Empêcher les doublons de favoris
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'unique_user_content_favorite') THEN
        ALTER TABLE public.user_favorites 
        ADD CONSTRAINT unique_user_content_favorite 
        UNIQUE (user_id, content_id);
    END IF;
END $$;

-- 4. Fonction sécurisée pour les statistiques de contenu
CREATE OR REPLACE FUNCTION public.get_content_stats(content_uuid uuid)
RETURNS TABLE(
    average_rating numeric,
    total_ratings bigint,
    total_favorites bigint
) 
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT 
        COALESCE(AVG(r.rating), 0)::numeric(3,1) as average_rating,
        COUNT(r.id) as total_ratings,
        COUNT(DISTINCT f.id) as total_favorites
    FROM public.content c
    LEFT JOIN public.reviews r ON c.id = r.content_id
    LEFT JOIN public.user_favorites f ON c.id = f.content_id
    WHERE c.id = content_uuid
      AND c.status = 'published'
    GROUP BY c.id;
$$;

-- 5. Index de performance sécurisés
CREATE INDEX IF NOT EXISTS idx_content_status_published ON public.content(status) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_reviews_content_id ON public.reviews(content_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_content ON public.user_favorites(user_id, content_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_user_content ON public.watch_history(user_id, content_id);

-- 6. Sécuriser le trigger de mise à jour des ratings
CREATE OR REPLACE FUNCTION public.update_content_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Vérifier que l'utilisateur est authentifié
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
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
        ),
        updated_at = now()
    WHERE id = COALESCE(NEW.content_id, OLD.content_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- 7. Ajouter un système de rôles pour l'administration future
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('user', 'admin', 'moderator');
    END IF;
END $$;

-- Ajouter la colonne role si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles 
        ADD COLUMN role public.user_role DEFAULT 'user';
    END IF;
END $$;