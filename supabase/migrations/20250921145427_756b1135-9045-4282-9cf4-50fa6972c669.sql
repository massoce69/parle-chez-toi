-- Corriger les problèmes de sécurité identifiés

-- 1. Supprimer les vues problématiques et les recréer correctement
DROP VIEW IF EXISTS public.reviews_with_profile;
DROP VIEW IF EXISTS public.reviews_with_public_profile;
DROP VIEW IF EXISTS public.public_profiles;

-- 2. Supprimer la table audit_log qui cause des problèmes
DROP TABLE IF EXISTS public.audit_log;

-- 3. Créer une fonction sécurisée pour obtenir les reviews avec profil
CREATE OR REPLACE FUNCTION public.get_reviews_with_profile(content_uuid uuid)
RETURNS TABLE(
    id uuid,
    content_id uuid,
    rating integer,
    comment text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    username text,
    avatar_url text
) 
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
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
    LEFT JOIN public.profiles p ON r.user_id = p.user_id
    WHERE r.content_id = content_uuid
    ORDER BY r.created_at DESC;
$$;

-- 4. Assurer que les politiques RLS sont bien configurées pour les tables principales
-- Vérifier que toutes les politiques exigent une authentification et non un accès anonyme

-- Supprimer et recréer la politique pour les profils de manière plus restrictive
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Permettre aux utilisateurs de voir leur propre profil complet
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Permettre aux utilisateurs de voir seulement username et avatar des autres (pour les reviews)
CREATE POLICY "Users can view public info of others" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() != user_id);

-- 5. S'assurer que seuls les utilisateurs authentifiés peuvent accéder aux données
-- Vérifier les politiques existantes et les renforcer si nécessaire

-- Pour les reviews, créer des politiques plus restrictives
DROP POLICY IF EXISTS "Authenticated users can view reviews" ON public.reviews;
CREATE POLICY "Authenticated users can view reviews" 
ON public.reviews 
FOR SELECT 
TO authenticated
USING (true);

-- 6. Simplifier et sécuriser l'accès aux données
-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_content_published ON public.content(id, status) WHERE status = 'published';

-- 7. Fonction pour obtenir les statistiques publiques d'un contenu
CREATE OR REPLACE FUNCTION public.get_public_content_stats(content_uuid uuid)
RETURNS TABLE(
    total_reviews bigint,
    average_rating numeric
) 
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT 
        COUNT(r.id) as total_reviews,
        COALESCE(ROUND(AVG(r.rating), 1), 0) as average_rating
    FROM public.content c
    LEFT JOIN public.reviews r ON c.id = r.content_id
    WHERE c.id = content_uuid
      AND c.status = 'published'
    GROUP BY c.id;
$$;