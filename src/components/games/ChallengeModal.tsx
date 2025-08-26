import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Mail, Trophy, CheckCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendChallenge: (email: string) => Promise<void>;
  challengerName: string;
  gameType: 'audio' | 'visual';
  difficulty: string;
  challengerScore?: number;
  isLoading?: boolean;
}

export const ChallengeModal: React.FC<ChallengeModalProps> = ({
  isOpen,
  onClose,
  onSendChallenge,
  challengerName,
  gameType,
  difficulty,
  challengerScore,
  isLoading = false
}) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const gameTypeDisplay = gameType === 'audio' ? 'Mémoire Auditive Inversée' : 'Mémoire Visuelle Inversée';
  const difficultyDisplay = difficulty === 'beginner' ? 'Débutant' : 
                           difficulty === 'intermediate' ? 'Intermédiaire' : 'Avancé';

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!email.trim()) {
      setError('Veuillez saisir une adresse email.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Veuillez saisir une adresse email valide.');
      return;
    }

    try {
      await onSendChallenge(email.trim());
      setSuccess(true);
      setEmail('');
      
      // Auto-close after 3 seconds
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 3000);
    } catch (err) {
      console.error('Erreur lors de l\'envoi du défi:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi du défi');
    }
  };

  const handleClose = () => {
    setEmail('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Défier un ami
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Info du défi */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="text-primary">🧠</span>
              {gameTypeDisplay}
            </div>
            <div className="text-sm text-muted-foreground">
              Niveau: <span className="font-medium">{difficultyDisplay}</span>
            </div>
            {challengerScore && (
              <div className="text-sm text-muted-foreground">
                Score à battre: <span className="font-medium text-primary">{challengerScore} points</span>
              </div>
            )}
          </div>

          {success ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Défi envoyé avec succès ! Votre ami va recevoir un email avec toutes les informations.
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email de votre ami</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="ami@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>{challengerName}</strong> enverra un email de défi à votre ami avec :
                </p>
                <ul className="text-xs text-blue-700 mt-2 space-y-1">
                  <li>• Le jeu et niveau à jouer</li>
                  <li>• Votre score à battre {challengerScore ? `(${challengerScore} points)` : '(aucun score)'}</li>
                  <li>• Un lien direct vers la plateforme</li>
                </ul>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Trophy className="h-4 w-4 mr-2" />
                      Envoyer le défi
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};