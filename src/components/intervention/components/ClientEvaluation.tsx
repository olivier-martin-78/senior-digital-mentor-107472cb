
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ClientEvaluationProps {
  clientRating: number;
  clientComments: string;
  onRatingChange: (rating: number) => void;
  onCommentsChange: (comments: string) => void;
}

export const ClientEvaluation: React.FC<ClientEvaluationProps> = ({
  clientRating,
  clientComments,
  onRatingChange,
  onCommentsChange,
}) => {
  return (
    <>
      {/* Evaluation de la prestation par le client */}
      <div>
        <Label>Evaluation de la prestation par le client</Label>
        <div className="flex items-center gap-2 mt-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onRatingChange(star)}
              className={`text-2xl transition-colors ${
                star <= clientRating 
                  ? 'text-yellow-500 hover:text-yellow-600' 
                  : 'text-gray-300 hover:text-gray-400'
              }`}
            >
              ⭐
            </button>
          ))}
          {clientRating > 0 && (
            <span className="text-sm text-gray-600 ml-2">
              {clientRating}/5 étoile{clientRating > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Commentaire du client */}
      <div>
        <Label htmlFor="client_comments">Commentaire du client</Label>
        <Textarea
          id="client_comments"
          value={clientComments}
          onChange={(e) => onCommentsChange(e.target.value)}
          placeholder="Commentaire ou retour du client sur la prestation..."
        />
      </div>
    </>
  );
};
