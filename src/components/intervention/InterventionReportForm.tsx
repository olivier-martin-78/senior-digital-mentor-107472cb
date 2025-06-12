import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSearchParams, useNavigate } from 'react-router-dom';
import InterventionAudioRecorder from './InterventionAudioRecorder';

const InterventionReportForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');
  const reportId = searchParams.get('reportId');

  const [reportData, setReportData] = useState({
    report: '',
    additional_notes: '',
    client_signature: false,
    professional_signature: false,
    media_url: '',
    media_name: '',
    media_type: '',
    media_size: 0,
  });
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioName, setAudioName] = useState<string | null>(null);

  useEffect(() => {
    if (reportId) {
      loadReportData(reportId);
    }
  }, [reportId]);

  const loadReportData = async (reportId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('intervention_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (error) throw error;

      setReportData({
        report: data.report || '',
        additional_notes: data.additional_notes || '',
        client_signature: data.client_signature || false,
        professional_signature: data.professional_signature || false,
        media_url: data.media_url || '',
        media_name: data.media_name || '',
        media_type: data.media_type || '',
        media_size: data.media_size || 0,
      });
      setAudioUrl(data.media_url || null);
      setAudioName(data.media_name || null);
    } catch (error) {
      console.error('Erreur lors du chargement du rapport:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger le rapport',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    setReportData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAudioUpload = async (file: File) => {
    setLoading(true);
    try {
      const mediaInfo = await uploadMediaFile(file);
      setReportData(prev => ({
        ...prev,
        media_url: mediaInfo.url,
        media_name: mediaInfo.name,
        media_type: mediaInfo.type,
        media_size: mediaInfo.size,
      }));
      setAudioUrl(mediaInfo.url);
      setAudioName(mediaInfo.name);
      toast({
        title: 'Succès',
        description: 'Fichier audio uploadé avec succès',
      });
    } catch (error) {
      console.error('Erreur lors de l\'upload du fichier audio:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'uploader le fichier audio',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const data = {
        ...reportData,
        professional_id: user.id,
        appointment_id: appointmentId,
      };

      if (reportId) {
        const { error } = await supabase
          .from('intervention_reports')
          .update(data)
          .eq('id', reportId);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Rapport modifié avec succès',
        });
      } else {
        const { error } = await supabase
          .from('intervention_reports')
          .insert([data]);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Rapport créé avec succès',
        });
      }

      navigate('/professional-scheduler');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du rapport:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le rapport',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadMediaFile = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `intervention-media/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('intervention-audio')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('intervention-audio')
        .getPublicUrl(filePath);

      return {
        url: publicUrl,
        name: file.name,
        type: file.type,
        size: file.size
      };
    } catch (error) {
      console.error('Erreur lors de l\'upload du fichier:', error);
      throw error;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Rapport d'Intervention</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="report">Rapport *</Label>
              <Textarea
                id="report"
                name="report"
                value={reportData.report}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="additional_notes">Notes additionnelles</Label>
              <Textarea
                id="additional_notes"
                name="additional_notes"
                value={reportData.additional_notes}
                onChange={handleInputChange}
              />
            </div>

            <InterventionAudioRecorder
              onAudioUpload={handleAudioUpload}
              existingAudioUrl={audioUrl}
              existingAudioName={audioName}
              disabled={loading}
            />

            <div className="flex items-center space-x-2">
              <Checkbox
                id="client_signature"
                name="client_signature"
                checked={reportData.client_signature}
                onCheckedChange={(checked) => setReportData(prev => ({ ...prev, client_signature: checked || false }))}
              />
              <Label htmlFor="client_signature">Signature du client</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="professional_signature"
                name="professional_signature"
                checked={reportData.professional_signature}
                onCheckedChange={(checked) => setReportData(prev => ({ ...prev, professional_signature: checked || false }))}
              />
              <Label htmlFor="professional_signature">Signature du professionnel</Label>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InterventionReportForm;
