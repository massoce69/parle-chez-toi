-- Fix search_path security issue for the update_content_rating function
CREATE OR REPLACE FUNCTION public.update_content_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
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

-- Fix search_path security issue for the update_updated_at_column function  
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;