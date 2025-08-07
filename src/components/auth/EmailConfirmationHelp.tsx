import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Mail, Clock, Shield, HelpCircle } from 'lucide-react';

const EmailConfirmationHelp = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Aide à la confirmation d'email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Comment confirmer votre email
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Après votre inscription, vous recevrez un email de confirmation</li>
              <li>Ouvrez l'email et cliquez sur le lien "Confirmer votre inscription"</li>
              <li>Vous serez automatiquement connecté à votre compte</li>
            </ol>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Délai de validité
            </h3>
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                Les liens de confirmation expirent après <strong>24 heures</strong>. 
                Si votre lien a expiré, utilisez la page "Renvoyer l'email de confirmation".
              </AlertDescription>
            </Alert>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4 text-red-500" />
              Email non reçu ?
            </h3>
            <div className="text-sm space-y-2">
              <p><strong>Vérifiez vos dossiers :</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Boîte de réception</li>
                <li>Courriers indésirables / Spam</li>
                <li>Promotions (Gmail)</li>
                <li>Autres dossiers de tri automatique</li>
              </ul>
              
              <p className="mt-4"><strong>Conseils pour éviter les spams :</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Ajoutez <code>noreply@senior-digital-mentor.com</code> à vos contacts</li>
                <li>Marquez nos emails comme "Non spam" si nécessaire</li>
                <li>Vérifiez les filtres de votre messagerie</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              Problèmes courants
            </h3>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">Erreur "invalid email" :</p>
                <p>Le lien a expiré ou est corrompu. Demandez un nouveau lien de confirmation.</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">Lien ne fonctionne pas :</p>
                <p>Copiez-collez le lien complet dans votre navigateur ou demandez un nouveau lien.</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">Email déjà confirmé :</p>
                <p>Votre compte est actif, vous pouvez vous connecter directement.</p>
              </div>
            </div>
          </div>

          <Alert className="bg-blue-50 border-blue-200">
            <HelpCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Besoin d'aide ?</AlertTitle>
            <AlertDescription className="text-blue-700">
              Si vous rencontrez toujours des difficultés, contactez notre support à l'adresse{' '}
              <a href="mailto:support@capria.fr" className="underline">support@capria.fr</a>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailConfirmationHelp;