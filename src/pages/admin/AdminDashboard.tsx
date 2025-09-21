import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Video, Eye, Star, TrendingUp, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function AdminDashboard() {
  const { profile } = useAdminAuth();

  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const [usersResult, contentResult, reviewsResult] = await Promise.all([
        supabase.from('profiles').select('id, role, created_at'),
        supabase.from('content').select('id, view_count, status, content_type'),
        supabase.from('reviews').select('id, rating, created_at')
      ]);

      const users = usersResult.data || [];
      const content = contentResult.data || [];
      const reviews = reviewsResult.data || [];

      const totalViews = content.reduce((sum, item) => sum + (item.view_count || 0), 0);
      const avgRating = reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
        : 0;

      // Recent activity (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const recentUsers = users.filter(user => 
        new Date(user.created_at) > weekAgo
      ).length;

      const recentReviews = reviews.filter(review => 
        new Date(review.created_at) > weekAgo
      ).length;

      return {
        totalUsers: users.length,
        totalContent: content.length,
        publishedContent: content.filter(c => c.status === 'published').length,
        totalViews,
        totalReviews: reviews.length,
        avgRating: Math.round(avgRating * 10) / 10,
        recentUsers,
        recentReviews,
        usersByRole: {
          admin: users.filter(u => u.role === 'admin').length,
          moderator: users.filter(u => u.role === 'moderator').length,
          user: users.filter(u => u.role === 'user').length,
        },
        contentByType: {
          movies: content.filter(c => c.content_type === 'movie').length,
          series: content.filter(c => c.content_type === 'series').length,
        }
      };
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Bienvenue, {profile?.full_name || profile?.username}
        </h1>
        <p className="text-muted-foreground">
          Voici un aperçu de votre plateforme Massflix
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.recentUsers || 0} cette semaine
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contenus</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.publishedContent || 0}</div>
            <p className="text-xs text-muted-foreground">
              /{stats?.totalContent || 0} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vues Total</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalViews?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              Toutes les vidéos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Note Moyenne</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgRating || 0}/5</div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalReviews || 0} avis
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Répartition des Utilisateurs</CardTitle>
            <CardDescription>Par rôle</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Administrateurs</span>
              <span className="font-medium">{stats?.usersByRole.admin || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Modérateurs</span>
              <span className="font-medium">{stats?.usersByRole.moderator || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Utilisateurs</span>
              <span className="font-medium">{stats?.usersByRole.user || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contenu par Type</CardTitle>
            <CardDescription>Films et séries</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Films</span>
              <span className="font-medium">{stats?.contentByType.movies || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Séries</span>
              <span className="font-medium">{stats?.contentByType.series || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activité Récente
          </CardTitle>
          <CardDescription>Derniers 7 jours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Nouveaux utilisateurs</span>
              <span className="font-medium text-green-600">+{stats?.recentUsers || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Nouveaux avis</span>
              <span className="font-medium text-blue-600">+{stats?.recentReviews || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}