
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { diagnosePermissions, syncUserPermissions } from '@/utils/permissionsDiagnostic';

export const PermissionsDiagnosticTool: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const { toast } = useToast();

  const handleDiagnostic = async () => {
    if (!email) {
      toast({
        title: "Email requis",
        description: "Veuillez saisir l'email de l'utilisateur",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await diagnosePermissions(email);
      setDiagnosticResult(result);
      
      toast({
        title: "Diagnostic terminé",
        description: "Vérifiez la console pour les détails"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors du diagnostic",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!email) {
      toast({
        title: "Email requis",
        description: "Veuillez saisir l'email de l'utilisateur",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await syncUserPermissions(email);
      
      toast({
        title: "Synchronisation terminée",
        description: result?.message || "Permissions synchronisées avec succès"
      });
      
      // Refaire le diagnostic après synchronisation
      await handleDiagnostic();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la synchronisation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Diagnostic des permissions utilisateur</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="Email de l'utilisateur"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button 
            onClick={handleDiagnostic}
            disabled={loading}
          >
            Diagnostiquer
          </Button>
          <Button 
            onClick={handleSync}
            disabled={loading}
            variant="outline"
          >
            Synchroniser
          </Button>
        </div>

        {diagnosticResult && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h3 className="font-medium mb-2">Résultats du diagnostic :</h3>
            <div className="text-sm space-y-1">
              <p><strong>Utilisateur :</strong> {diagnosticResult.userProfile?.email}</p>
              <p><strong>Groupes :</strong> {diagnosticResult.groupMemberships?.length || 0}</p>
              <p><strong>Invitations :</strong> {diagnosticResult.invitations?.length || 0}</p>
              <p><strong>Albums accessibles :</strong> {diagnosticResult.albums?.length || 0}</p>
              <p><strong>Posts accessibles :</strong> {diagnosticResult.posts?.length || 0}</p>
              <p><strong>Entrées journal accessibles :</strong> {diagnosticResult.diaryEntries?.length || 0}</p>
            </div>
            <p className="text-xs mt-2 text-gray-600">
              Détails complets dans la console du navigateur (F12)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PermissionsDiagnosticTool;
