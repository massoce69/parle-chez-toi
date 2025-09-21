import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Users, Info } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  const { profile } = useAdminAuth();

  // Dans la version locale, on affiche juste l'utilisateur courant
  const users = [profile].filter(Boolean);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestion des Utilisateurs (Local)</CardTitle>
          <CardDescription>
            Version locale - Gestion simplifiée des utilisateurs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Dans la version locale, la gestion multi-utilisateurs est simplifiée. 
              Seul le compte administrateur principal est affiché.
            </AlertDescription>
          </Alert>

          {/* Search (disabled for local version) */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Recherche désactivée en mode local..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                disabled
              />
            </div>
          </div>

          {/* Current user info */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Users className="h-5 w-5" />
              Compte Administrateur
            </h3>
            
            {profile && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <div className="font-medium">
                        {profile.full_name || profile.username || 'Administrateur'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {profile.username || 'admin@massflix.local'}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <span className="capitalize">{profile.role || 'admin'}</span>
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {profile.subscription_plan || 'admin'}
                      </Badge>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      Version locale - Toutes les permissions
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Fonctionnalités locales :</strong>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>Authentification simplifiée avec JWT</li>
                  <li>Base de données SQLite locale</li>
                  <li>Pas de gestion multi-utilisateurs avancée</li>
                  <li>Scanner automatique des médias</li>
                  <li>Interface d'administration complète</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}