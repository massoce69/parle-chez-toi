import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MessageSquare } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  profile?: {
    full_name?: string;
    username?: string;
    avatar_url?: string;
  };
}

interface ReviewSectionProps {
  contentId: string;
  reviews: Review[];
}

export const ReviewSection = ({ contentId, reviews }: ReviewSectionProps) => {
  const [newReview, setNewReview] = useState('');
  const [rating, setRating] = useState(5);

  const handleSubmitReview = () => {
    // Dans la version locale, on ne fait rien pour l'instant
    // TODO: Implémenter la soumission d'avis vers l'API locale
    setNewReview('');
    setRating(5);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating 
            ? 'text-yellow-400 fill-yellow-400' 
            : 'text-muted-foreground'
        }`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Add Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Ajouter un avis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Note</label>
            <div className="flex gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setRating(i + 1)}
                  className="hover:scale-110 transition-transform"
                >
                  <Star
                    className={`h-6 w-6 ${
                      i < rating 
                        ? 'text-yellow-400 fill-yellow-400' 
                        : 'text-muted-foreground hover:text-yellow-400'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Commentaire</label>
            <Textarea
              value={newReview}
              onChange={(e) => setNewReview(e.target.value)}
              placeholder="Partagez votre avis sur ce contenu..."
              rows={3}
            />
          </div>
          
          <Button onClick={handleSubmitReview} disabled={!newReview.trim()}>
            Publier l'avis
          </Button>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          Avis ({reviews.length})
        </h3>
        
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarImage src={review.profile?.avatar_url} />
                      <AvatarFallback>
                        {review.profile?.full_name?.charAt(0) || 
                         review.profile?.username?.charAt(0) || 
                         'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {review.profile?.full_name || review.profile?.username || 'Utilisateur'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {renderStars(review.rating)}
                            <span className="text-sm text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline">{review.rating}/5</Badge>
                      </div>
                      
                      {review.comment && (
                        <p className="text-muted-foreground">{review.comment}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun avis</h3>
              <p className="text-muted-foreground">
                Soyez le premier à donner votre avis sur ce contenu.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};