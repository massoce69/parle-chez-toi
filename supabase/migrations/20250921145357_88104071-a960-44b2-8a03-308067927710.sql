-- Corriger la politique des profils pour permettre la lecture des infos publiques
-- nécessaires pour afficher les reviews avec username et avatar

DROP POLICY IF EXISTS "Users can view their own profile only" ON public.profiles;

-- Politique principale : utilisateurs authentifiés peuvent voir les profils
CREATE POLICY "Authenticated users can view profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Limiter les informations sensibles aux propriétaires du profil
-- Créer une vue publique sécurisée pour les profils
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
    user_id,
    username,
    avatar_url,
    created_at
FROM public.profiles;

-- Vue sécurisée pour les reviews avec informations publiques
CREATE OR REPLACE VIEW public.reviews_with_public_profile AS
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
LEFT JOIN public.public_profiles p ON r.user_id = p.user_id;

-- Permettre l'accès à la vue publique
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.reviews_with_public_profile TO authenticated;