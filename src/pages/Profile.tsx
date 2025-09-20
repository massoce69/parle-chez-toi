import { useState } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MovieCard } from '@/components/MovieCard';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useFavorites } from '@/hooks/useFavorites';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { useToast } from '@/hooks/use-toast';
import { User, Heart, History, Settings, Crown } from 'lucide-react';

const Profile = () => {
  const { user, signOut } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { favorites } = useFavorites();
  const { watchHistory } = useWatchHistory();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    username: profile?.username || '',
    avatar_url: profile?.avatar_url || ''
  });

  const handleUpdateProfile = async () => {
    try {
      await updateProfile(formData);
      setIsEditing(false);
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été sauvegardées avec succès."
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil.",
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Déconnexion",
        description: "À bientôt sur Massflix !"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de se déconnecter.",
        variant: "destructive"
      });
    }
  };

  const transformContent = (content: any[]) => {
    return content.map(item => ({
      id: item.content?.id || item.id,
      title: item.content?.title || item.title,
      genre: item.content?.genres?.join(', ') || item.genres?.join(', ') || '',
      year: item.content?.release_year || item.release_year || 2024,
      rating: item.content?.average_rating || item.average_rating || 0,
      duration: (item.content?.content_type || item.content_type) === 'series' ? 
        `${Math.ceil(((item.content?.duration_minutes || item.duration_minutes) || 45) / 45)} saisons` : 
        `${(item.content?.duration_minutes || item.duration_minutes) || 120} min`,
      image: item.content?.poster_url || item.poster_url || '',
      isNew: item.content?.is_new || item.is_new || false
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Profile Header */}
          <div className="text-center space-y-4">
            <Avatar className="w-24 h-24 mx-auto">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="text-2xl">
                {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h1 className="text-3xl font-bold">
                {profile?.full_name || profile?.username || 'Utilisateur'}
              </h1>
              <p className="text-muted-foreground">{user?.email}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Crown className="h-4 w-4 text-accent" />
                <Badge variant="secondary">
                  {profile?.subscription_plan === 'premium' ? 'Premium' : 'Gratuit'}
                </Badge>
              </div>
            </div>
          </div>

          <Tabs defaultValue="favorites" className="space-y-8">
            <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
              <TabsTrigger value="favorites" className="gap-2">
                <Heart className="h-4 w-4" />
                Favoris
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                Historique
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4" />
                Paramètres
              </TabsTrigger>
            </TabsList>

            <TabsContent value="favorites" className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-6">Ma liste ({favorites.length})</h2>
                {favorites.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                    {transformContent(favorites).map(movie => (
                      <MovieCard key={movie.id} {...movie} />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Aucun favori</h3>
                      <p className="text-muted-foreground">
                        Ajoutez des films et séries à votre liste pour les retrouver facilement.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-6">Historique de visionnage</h2>
                {watchHistory.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                    {transformContent(watchHistory).map(movie => (
                      <MovieCard key={movie.id} {...movie} />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Aucun historique</h3>
                      <p className="text-muted-foreground">
                        Votre historique de visionnage apparaîtra ici.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <div className="max-w-2xl mx-auto space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Informations personnelles
                    </CardTitle>
                    <CardDescription>
                      Gérez vos informations de profil
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nom complet</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                        disabled={!isEditing}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="username">Nom d'utilisateur</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="avatar_url">URL de l'avatar</Label>
                      <Input
                        id="avatar_url"
                        value={formData.avatar_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, avatar_url: e.target.value }))}
                        disabled={!isEditing}
                        placeholder="https://..."
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      {isEditing ? (
                        <>
                          <Button onClick={handleUpdateProfile}>
                            Sauvegarder
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setIsEditing(false);
                              setFormData({
                                full_name: profile?.full_name || '',
                                username: profile?.username || '',
                                avatar_url: profile?.avatar_url || ''
                              });
                            }}
                          >
                            Annuler
                          </Button>
                        </>
                      ) : (
                        <Button onClick={() => setIsEditing(true)}>
                          Modifier
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Compte</CardTitle>
                    <CardDescription>
                      Actions liées à votre compte
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="destructive" onClick={handleSignOut}>
                      Se déconnecter
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Profile;