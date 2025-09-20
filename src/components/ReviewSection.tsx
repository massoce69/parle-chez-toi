import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Review {
  id: string;
  rating: number;
  comment?: string;
  created_at: string;
  user_id: string;
  profiles: {
    username?: string;
    full_name?: string;
    avatar_url?: string;
  };
}

interface ReviewSectionProps {
  contentId: string;
  reviews: Review[];
}

export const ReviewSection = ({ contentId, reviews }: ReviewSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  const addReviewMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('reviews')
        .insert({
          content_id: contentId,
          user_id: user!.id,
          rating,
          comment: comment.trim() || null,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-reviews', contentId] });
      setRating(0);
      setComment('');
      toast({
        title: "Avis ajouté",
        description: "Votre avis a été publié avec succès."
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter votre avis.",
        variant: "destructive"
      });
    },
  });

  const userHasReviewed = reviews.some(review => review.user_id === user?.id);

  const renderStars = (currentRating: number, interactive = false) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-5 w-5 cursor-pointer transition-colors ${
          i < currentRating
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-400 hover:text-yellow-400'
        }`}
        onClick={interactive ? () => setRating(i + 1) : undefined}
        onMouseEnter={interactive ? () => setHoveredRating(i + 1) : undefined}
        onMouseLeave={interactive ? () => setHoveredRating(0) : undefined}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Add Review Form */}
      {user && !userHasReviewed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Donner mon avis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Note</p>
              <div 
                className="flex gap-1"
                onMouseLeave={() => setHoveredRating(0)}
              >
                {renderStars(hoveredRating || rating, true)}
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-2">Commentaire (optionnel)</p>
              <Textarea
                placeholder="Partagez votre opinion sur ce contenu..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
            </div>
            
            <Button 
              onClick={() => addReviewMutation.mutate()}
              disabled={rating === 0 || addReviewMutation.isPending}
              className="w-full"
            >
              {addReviewMutation.isPending ? 'Publication...' : 'Publier mon avis'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarImage src={review.profiles.avatar_url} />
                    <AvatarFallback>
                      {(review.profiles.full_name || review.profiles.username || 'U').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">
                          {review.profiles.full_name || review.profiles.username || 'Utilisateur'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(review.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {renderStars(review.rating)}
                        </div>
                        <Badge variant="secondary">
                          {review.rating}/5
                        </Badge>
                      </div>
                    </div>
                    
                    {review.comment && (
                      <p className="text-sm leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
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