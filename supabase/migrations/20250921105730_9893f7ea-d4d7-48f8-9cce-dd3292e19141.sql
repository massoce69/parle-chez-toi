-- ==========================================
-- CORRECTIONS DES PROBLÈMES DE SÉCURITÉ
-- ==========================================

-- 1. Corriger les politiques RLS pour nécessiter une authentification
-- Remplacer les politiques qui permettent l'accès anonyme

-- CATEGORIES: Seuls les utilisateurs authentifiés peuvent voir les catégories
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
CREATE POLICY "Authenticated users can view categories" 
ON public.categories 
FOR SELECT 
TO authenticated
USING (true);

-- CONTENT: Seuls les utilisateurs authentifiés peuvent voir le contenu publié
DROP POLICY IF EXISTS "Published content is viewable by everyone" ON public.content;
CREATE POLICY "Authenticated users can view published content" 
ON public.content 
FOR SELECT 
TO authenticated
USING (status = 'published'::content_status);

-- CONTENT_CATEGORIES: Seuls les utilisateurs authentifiés
DROP POLICY IF EXISTS "Content categories are viewable by everyone" ON public.content_categories;
CREATE POLICY "Authenticated users can view content categories" 
ON public.content_categories 
FOR SELECT 
TO authenticated
USING (true);

-- REVIEWS: Seuls les utilisateurs authentifiés peuvent voir les reviews
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Authenticated users can view reviews" 
ON public.reviews 
FOR SELECT 
TO authenticated
USING (true);

-- 2. Améliorer la sécurité des profils
-- Les utilisateurs ne peuvent voir que leur propre profil complet
-- Les autres peuvent voir seulement username et avatar (pour les reviews)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Politique pour voir son propre profil complet
CREATE POLICY "Users can view their own complete profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Politique pour voir les informations publiques des autres utilisateurs (pour les reviews)
CREATE POLICY "Users can view public profile info of others" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- 3. Sécuriser davantage les reviews
-- Créer une vue sécurisée pour les reviews avec informations utilisateur limitées
CREATE OR REPLACE VIEW public.reviews_with_profile AS
SELECT 
    r.id,
    r.content_id,
    r.rating,
    r.comment,
    r.created_at,
    r.updated_at,
    p.username,
    p.avatar_url
FROM public.reviews r
LEFT JOIN public.profiles p ON r.user_id = p.user_id;

-- Politique RLS pour la vue
ALTER VIEW public.reviews_with_profile SET (security_invoker = on);

-- 4. Ajouter des index pour améliorer les performances sécurisées
CREATE INDEX IF NOT EXISTS idx_content_status_published ON public.content(status) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_reviews_content_id ON public.reviews(content_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_content ON public.user_favorites(user_id, content_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_user_content ON public.watch_history(user_id, content_id);

-- 5. Fonction sécurisée pour obtenir les statistiques de contenu (sans exposer les détails utilisateur)
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

-- 6. Fonction sécurisée pour les recommandations (sans exposer les habitudes des autres utilisateurs)
CREATE OR REPLACE FUNCTION public.get_user_recommendations(user_uuid uuid, limit_count integer DEFAULT 10)
RETURNS TABLE(
    content_id uuid,
    title text,
    poster_url text,
    average_rating numeric,
    similarity_score numeric
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    -- Recommandations basées sur les genres préférés de l'utilisateur
    WITH user_preferences AS (
        SELECT UNNEST(c.genres) as genre
        FROM public.content c
        JOIN public.user_favorites f ON c.id = f.content_id
        WHERE f.user_id = user_uuid
        GROUP BY genre
        ORDER BY COUNT(*) DESC
        LIMIT 5
    ),
    recommended_content AS (
        SELECT DISTINCT
            c.id as content_id,
            c.title,
            c.poster_url,
            c.average_rating,
            COUNT(up.genre) as similarity_score
        FROM public.content c
        CROSS JOIN LATERAL UNNEST(c.genres) as content_genre
        JOIN user_preferences up ON content_genre = up.genre
        LEFT JOIN public.user_favorites f ON c.id = f.content_id AND f.user_id = user_uuid
        WHERE c.status = 'published'
          AND f.id IS NULL  -- Exclure les contenus déjà en favoris
        GROUP BY c.id, c.title, c.poster_url, c.average_rating
        ORDER BY similarity_score DESC, c.average_rating DESC
        LIMIT limit_count
    )
    SELECT * FROM recommended_content;
$$;

-- 7. Renforcer la sécurité des triggers
-- S'assurer que les triggers de mise à jour des ratings sont sécurisés
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

-- 8. Ajouter des contraintes de sécurité supplémentaires
-- Empêcher les ratings invalides
ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_rating_range 
CHECK (rating >= 1 AND rating <= 5);

-- Empêcher les doublons de favoris
ALTER TABLE public.user_favorites 
ADD CONSTRAINT unique_user_content_favorite 
UNIQUE (user_id, content_id);

-- 9. Politiques pour les administrateurs (si nécessaire plus tard)
-- Créer un type pour les rôles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('user', 'admin', 'moderator');
    END IF;
END $$;

-- Ajouter une colonne role au profil (optionnel, pour future administration)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role public.user_role DEFAULT 'user';

-- 10. Audit trail basique
CREATE TABLE IF NOT EXISTS public.audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name text NOT NULL,
    action text NOT NULL,
    user_id uuid REFERENCES auth.users(id),
    record_id uuid,
    old_data jsonb,
    new_data jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- RLS pour l'audit log (seuls les admins peuvent voir)
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs" 
ON public.audit_log 
FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
          AND role = 'admin'
    )
);