
import React from 'react';

interface ClientEvaluationSectionProps {
  clientRating?: number;
  clientComments?: string;
}

export const ClientEvaluationSection: React.FC<ClientEvaluationSectionProps> = ({
  clientRating,
  clientComments
}) => {
  if (!clientRating && !clientComments) return null;

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">Évaluation du client</h3>
      <div className="bg-gray-50 p-3 rounded-md space-y-2">
        {clientRating && (
          <div>
            <p className="text-sm font-medium mb-1">Note de satisfaction :</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-lg ${
                    star <= clientRating 
                      ? 'text-yellow-500' 
                      : 'text-gray-300'
                  }`}
                >
                  ★
                </span>
              ))}
              <span className="text-sm text-gray-600 ml-2">
                {clientRating}/5 étoile{clientRating > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
        {clientComments && (
          <div>
            <p className="text-sm font-medium mb-1">Commentaire du client :</p>
            <p className="text-sm">{clientComments}</p>
          </div>
        )}
      </div>
    </div>
  );
};
