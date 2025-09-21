import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Video, Eye, Star, TrendingUp, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export default function AdminDashboard() {
  const { profile } = useAdminAuth();

  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      try {
        // Dans la version locale, on simule les statistiques
        // ou on les récupère via des endpoints dédiés
        const content = await apiClient.getContent({ limit: 1000 });
        
        const totalViews = content.reduce((sum: number, item: any) => sum + (item.view_count || 0), 0);
        const totalContent = content.length;
        const publishedContent = content.filter((c: any) => c.status === 'published').length;
        
        return {
          totalUsers: 1, // Simulated for local version
          totalContent,
          publishedContent,
          totalViews,
          totalReviews: 0,
          avgRating: 0,
          recentUsers: 0,
          recentReviews: 0,
          usersByRole: {
            admin: 1,
            moderator: 0,
            user: 0,
          },
          contentByType: {
            movies: content.filter((c: any) => c.content_type === 'movie').length,
            series: content.filter((c: any) => c.content_type === 'series').length,
          }
        };
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return {
          totalUsers: 0,
          totalContent: 0,
          publishedContent: 0,
          totalViews: 0,
          totalReviews: 0,
          avgRating: 0,
          recentUsers: 0,
          recentReviews: 0,
          usersByRole: { admin: 0, moderator: 0, user: 0 },
          contentByType: { movies: 0, series: 0 }
        };
      }
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
          Voici un aperçu de votre plateforme Massflix (Version Locale)
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
              Version locale
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
              Médias scannés
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
            <CardTitle className="text-sm font-medium">Scanner</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Actif</div>
            <p className="text-xs text-muted-foreground">
              Détection automatique
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed stats */}
      <div className="grid gap-4 md:grid-cols-2">
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

        <Card>
          <CardHeader>
            <CardTitle>Configuration Locale</CardTitle>
            <CardDescription>Informations système</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Base de données</span>
              <span className="font-medium text-green-600">SQLite</span>
            </div>
            <div className="flex justify-between">
              <span>Scanner auto</span>
              <span className="font-medium text-green-600">Activé</span>
            </div>
            <div className="flex justify-between">
              <span>Mode</span>
              <span className="font-medium text-blue-600">Local</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}