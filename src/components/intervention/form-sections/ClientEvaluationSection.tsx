
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { InterventionFormData } from '../types/FormData';

interface ClientEvaluationSectionProps {
  formData: InterventionFormData;
  setFormData: (data: InterventionFormData | ((prev: InterventionFormData) => InterventionFormData)) => void;
}

export const ClientEvaluationSection: React.FC<ClientEvaluationSectionProps> = ({
  formData,
  setFormData
}) => {
  const handleRatingChange = (rating: number) => {
    setFormData(prev => ({ ...prev, client_rating: rating }));
  };

  const handleCommentsChange = (comments: string) => {
    setFormData(prev => ({ ...prev, client_comments: comments }));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Évaluation du client</h3>
      
      {/* Evaluation de la prestation par le client */}
      <div>
        <Label>Evaluation de la prestation par le client</Label>
        <div className="flex items-center gap-2 mt-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleRatingChange(star)}
              className={`text-2xl transition-colors ${
                star <= formData.client_rating 
                  ? 'text-yellow-500 hover:text-yellow-600' 
                  : 'text-gray-300 hover:text-gray-400'
              }`}
            >
              ★
            </button>
          ))}
          {formData.client_rating > 0 && (
            <span className="text-sm text-gray-600 ml-2">
              {formData.client_rating}/5 étoile{formData.client_rating > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Commentaire du client */}
      <div>
        <Label htmlFor="client_comments">Commentaire du client</Label>
        <Textarea
          id="client_comments"
          value={formData.client_comments}
          onChange={(e) => handleCommentsChange(e.target.value)}
          placeholder="Commentaire ou retour du client sur la prestation..."
        />
      </div>
    </div>
  );
};
