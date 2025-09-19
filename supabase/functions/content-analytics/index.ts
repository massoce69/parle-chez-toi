import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyticsRequest {
  action: 'increment_view' | 'get_recommendations';
  content_id?: string;
  user_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { action, content_id, user_id }: AnalyticsRequest = await req.json();

    switch (action) {
      case 'increment_view':
        if (!content_id) {
          throw new Error('content_id is required for increment_view action');
        }

        // Increment view count
        const { data: updateResult, error: updateError } = await supabase
          .from('content')
          .update({ 
            view_count: supabase.sql`view_count + 1` 
          })
          .eq('id', content_id)
          .select('view_count')
          .single();

        if (updateError) {
          throw updateError;
        }

        // Add to watch history if user is provided
        if (user_id) {
          await supabase
            .from('watch_history')
            .upsert({
              user_id,
              content_id,
              watched_at: new Date().toISOString(),
            });
        }

        console.log(`View count incremented for content ${content_id}. New count: ${updateResult.view_count}`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            view_count: updateResult.view_count 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );

      case 'get_recommendations':
        if (!user_id) {
          throw new Error('user_id is required for get_recommendations action');
        }

        // Get user's watch history and favorites to determine preferences
        const { data: watchHistory, error: historyError } = await supabase
          .from('watch_history')
          .select(`
            content:content_id (
              id,
              title,
              genres,
              content_type,
              average_rating
            )
          `)
          .eq('user_id', user_id)
          .limit(20);

        if (historyError) {
          throw historyError;
        }

        const { data: favorites, error: favoritesError } = await supabase
          .from('user_favorites')
          .select(`
            content:content_id (
              id,
              title,
              genres,
              content_type,
              average_rating
            )
          `)
          .eq('user_id', user_id);

        if (favoritesError) {
          throw favoritesError;
        }

        // Extract genres from user's viewing history
        const userGenres = new Set<string>();
        const viewedContentIds = new Set<string>();

        [...(watchHistory || []), ...(favorites || [])].forEach((item: any) => {
          if (item.content) {
            viewedContentIds.add(item.content.id);
            if (item.content.genres) {
              item.content.genres.forEach((genre: string) => userGenres.add(genre));
            }
          }
        });

        // Get recommendations based on genres, excluding already viewed content
        const genreArray = Array.from(userGenres);
        let recommendations = [];

        if (genreArray.length > 0) {
          const { data: recommendedContent, error: recError } = await supabase
            .from('content')
            .select('*')
            .eq('status', 'published')
            .not('id', 'in', `(${Array.from(viewedContentIds).map(id => `"${id}"`).join(',')})`)
            .gte('average_rating', 7.0)
            .order('average_rating', { ascending: false })
            .limit(10);

          if (recError) {
            throw recError;
          }

          // Filter by preferred genres
          recommendations = (recommendedContent || []).filter((content: any) => {
            if (!content.genres) return false;
            return content.genres.some((genre: string) => userGenres.has(genre));
          });
        }

        // If not enough recommendations, get trending content
        if (recommendations.length < 5) {
          const { data: trendingContent, error: trendingError } = await supabase
            .from('content')
            .select('*')
            .eq('status', 'published')
            .not('id', 'in', `(${Array.from(viewedContentIds).map(id => `"${id}"`).join(',')})`)
            .order('view_count', { ascending: false })
            .limit(10);

          if (!trendingError && trendingContent) {
            recommendations = [
              ...recommendations,
              ...trendingContent.slice(0, 10 - recommendations.length)
            ];
          }
        }

        console.log(`Generated ${recommendations.length} recommendations for user ${user_id}`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            recommendations: recommendations.slice(0, 8)
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('Error in content-analytics function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});