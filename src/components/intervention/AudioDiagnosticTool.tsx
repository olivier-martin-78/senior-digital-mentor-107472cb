
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cleanupExpiredAudioUrls, validateAndCleanAudioUrl } from '@/utils/audioUrlCleanup';

interface AudioDiagnosticToolProps {
  reportId: string;
  currentAudioUrl: string | null;
  onAudioStatusChange: (status: 'loading' | 'valid' | 'expired' | 'none') => void;
}

export const AudioDiagnosticTool: React.FC<AudioDiagnosticToolProps> = ({
  reportId,
  currentAudioUrl,
  onAudioStatusChange
}) => {
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<{
    status: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  const runDiagnostic = async () => {
    console.log('🔍 DIAGNOSTIC - Début du diagnostic audio pour:', reportId);
    setIsRunningDiagnostic(true);
    setDiagnosticResult(null);
    onAudioStatusChange('loading');

    try {
      // Récupérer les données actuelles du rapport
      const { data: report, error } = await supabase
        .from('intervention_reports')
        .select('audio_url')
        .eq('id', reportId)
        .single();

      if (error) {
        console.error('❌ DIAGNOSTIC - Erreur récupération rapport:', error);
        setDiagnosticResult({
          status: 'error',
          message: 'Impossible de récupérer les données du rapport'
        });
        onAudioStatusChange('none');
        return;
      }

      console.log('🔍 DIAGNOSTIC - Données rapport:', {
        reportId,
        audioUrl: report.audio_url,
        audioUrlType: typeof report.audio_url
      });

      if (!report.audio_url) {
        setDiagnosticResult({
          status: 'warning',
          message: 'Aucun enregistrement audio trouvé pour ce rapport'
        });
        onAudioStatusChange('none');
        return;
      }

      // Valider l'URL audio
      const validatedUrl = await validateAndCleanAudioUrl(report.audio_url, reportId);
      
      if (validatedUrl) {
        setDiagnosticResult({
          status: 'success',
          message: 'Enregistrement audio accessible et fonctionnel'
        });
        onAudioStatusChange('valid');
      } else {
        setDiagnosticResult({
          status: 'warning',
          message: 'URL audio expirée ou inaccessible - nettoyée de la base de données'
        });
        onAudioStatusChange('expired');
      }

    } catch (error) {
      console.error('❌ DIAGNOSTIC - Erreur générale:', error);
      setDiagnosticResult({
        status: 'error',
        message: 'Erreur lors du diagnostic audio'
      });
      onAudioStatusChange('none');
    } finally {
      setIsRunningDiagnostic(false);
    }
  };

  const runGlobalCleanup = async () => {
    try {
      await cleanupExpiredAudioUrls();
      toast({
        title: 'Nettoyage terminé',
        description: 'Les URLs audio expirées ont été nettoyées',
      });
    } catch (error) {
      console.error('Erreur lors du nettoyage global:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de nettoyer les URLs audio',
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = () => {
    if (!diagnosticResult) return null;
    
    switch (diagnosticResult.status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertCircle className="w-5 h-5" />
          Diagnostic Audio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-orange-700">
          <p><strong>État actuel :</strong> {currentAudioUrl ? 'URL audio présente' : 'Aucune URL audio'}</p>
          {currentAudioUrl && (
            <p className="text-xs text-gray-600 mt-1 break-all">
              URL: {currentAudioUrl}
            </p>
          )}
        </div>

        {diagnosticResult && (
          <div className={`p-3 rounded-lg border flex items-start gap-3 ${
            diagnosticResult.status === 'success' ? 'bg-green-50 border-green-200' :
            diagnosticResult.status === 'warning' ? 'bg-orange-50 border-orange-200' :
            'bg-red-50 border-red-200'
          }`}>
            {getStatusIcon()}
            <div className="flex-1">
              <p className="text-sm font-medium">Résultat du diagnostic</p>
              <p className="text-sm text-gray-600 mt-1">{diagnosticResult.message}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={runDiagnostic}
            disabled={isRunningDiagnostic}
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRunningDiagnostic ? 'animate-spin' : ''}`} />
            {isRunningDiagnostic ? 'Diagnostic...' : 'Lancer le diagnostic'}
          </Button>
          
          <Button
            onClick={runGlobalCleanup}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Nettoyer tous les audios
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
