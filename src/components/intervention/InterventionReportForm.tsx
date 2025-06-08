
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { InterventionReport, AppointmentForIntervention } from '@/types/intervention';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, Clock, User, FileText, Save, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import VoiceRecorder from '@/components/VoiceRecorder';
import MediaUploader from './MediaUploader';

const InterventionReportForm = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Récupérer les données depuis location.state si elles existent
  const reportData = location.state?.reportData as InterventionReport | undefined;
  const appointmentId = location.state?.appointmentId as string | undefined;
  const isViewMode = location.state?.isViewMode as boolean | false;

  const [formData, setFormData] = useState<Partial<InterventionReport>>({
    professional_id: user?.id || '',
    date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '09:00',
    end_time: '11:00',
    auxiliary_name: '',
    patient_name: '',
    physical_state: [],
    physical_state_other: '',
    pain_location: '',
    mental_state: [],
    mental_state_change: '',
    appetite: '',
    hydration: '',
    appetite_comments: '',
    hygiene: [],
    hygiene_comments: '',
    activities: [],
    activities_other: '',
    observations: '',
    follow_up: [],
    follow_up_other: '',
    audio_url: '',
    media_files: []
  });

  const [appointments, setAppointments] = useState<AppointmentForIntervention[]>([]);
  const [loading, setLoading] = useState(false);

  // Charger les données du rapport si elles sont fournies
  useEffect(() => {
    if (reportData) {
      setFormData({
        ...reportData,
        // S'assurer que les tableaux sont bien des tableaux
        physical_state: Array.isArray(reportData.physical_state) ? reportData.physical_state : [],
        mental_state: Array.isArray(reportData.mental_state) ? reportData.mental_state : [],
        hygiene: Array.isArray(reportData.hygiene) ? reportData.hygiene : [],
        activities: Array.isArray(reportData.activities) ? reportData.activities : [],
        follow_up: Array.isArray(reportData.follow_up) ? reportData.follow_up : [],
        media_files: Array.isArray(reportData.media_files) ? reportData.media_files : []
      });
    }
  }, [reportData]);

  // Charger les rendez-vous du jour pour le professionnel
  useEffect(() => {
    if (user && !reportData) {
      loadTodayAppointments();
    }
  }, [user, reportData]);

  const loadTodayAppointments = async () => {
    if (!user) return;

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          end_time,
          status,
          clients:client_id (
            first_name,
            last_name
          )
        `)
        .eq('professional_id', user.id)
        .eq('status', 'scheduled')
        .gte('start_time', `${today}T00:00:00`)
        .lt('start_time', `${today}T23:59:59`)
        .order('start_time', { ascending: true });

      if (error) throw error;

      const transformedAppointments = (data || []).map(appointment => ({
        id: appointment.id,
        start_time: appointment.start_time,
        end_time: appointment.end_time,
        status: appointment.status,
        client: appointment.clients
      }));

      setAppointments(transformedAppointments);
    } catch (error) {
      console.error('Erreur lors du chargement des rendez-vous:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les rendez-vous du jour',
        variant: 'destructive',
      });
    }
  };

  const handleInputChange = (field: keyof InterventionReport, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field: keyof InterventionReport, value: string, checked: boolean) => {
    setFormData(prev => {
      const currentArray = (prev[field] as string[]) || [];
      if (checked) {
        return { ...prev, [field]: [...currentArray, value] };
      } else {
        return { ...prev, [field]: currentArray.filter(item => item !== value) };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const dataToSubmit = {
        ...formData,
        professional_id: user.id,
        appointment_id: appointmentId || formData.appointment_id,
        // S'assurer que les champs requis sont présents
        auxiliary_name: formData.auxiliary_name || '',
        patient_name: formData.patient_name || '',
        date: formData.date || format(new Date(), 'yyyy-MM-dd'),
        start_time: formData.start_time || '09:00',
        end_time: formData.end_time || '11:00'
      };

      if (reportData?.id) {
        // Mise à jour d'un rapport existant
        const { error } = await supabase
          .from('intervention_reports')
          .update(dataToSubmit)
          .eq('id', reportData.id);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Rapport d\'intervention mis à jour avec succès',
        });
      } else {
        // Création d'un nouveau rapport
        const { data: newReport, error } = await supabase
          .from('intervention_reports')
          .insert(dataToSubmit)
          .select()
          .single();

        if (error) throw error;

        // Mettre à jour le rendez-vous avec l'ID du rapport
        if (appointmentId || formData.appointment_id) {
          await supabase
            .from('appointments')
            .update({ intervention_report_id: newReport.id })
            .eq('id', appointmentId || formData.appointment_id);
        }

        toast({
          title: 'Succès',
          description: 'Rapport d\'intervention créé avec succès',
        });
      }

      if (isViewMode) {
        navigate('/scheduler');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le rapport',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAudioChange = (audioBlob: Blob | null) => {
    console.log('Audio changed:', audioBlob);
    // Handle audio blob if needed
  };

  const handleMediaUpload = (files: File[]) => {
    console.log('Files uploaded:', files);
    // Handle uploaded files
  };

  const physicalStateOptions = [
    'Autonome', 'Besoin d\'aide partielle', 'Dépendant', 'Alité', 'Mobilité réduite', 'Chutes'
  ];

  const mentalStateOptions = [
    'Calme', 'Anxieux', 'Confus', 'Agité', 'Triste', 'Joyeux', 'Apathique'
  ];

  const hygieneOptions = [
    'Toilette complète', 'Toilette partielle', 'Aide pour l\'habillage', 'Soins des pieds', 'Soins des cheveux'
  ];

  const activitiesOptions = [
    'Repas', 'Promenade', 'Lecture', 'Télévision', 'Jeux', 'Exercices', 'Sorties'
  ];

  const followUpOptions = [
    'Rien à signaler', 'Contacter médecin', 'Surveillance accrue', 'Ajuster traitement', 'Prévenir famille'
  ];

  return (
    <div className="space-y-6">
      {isViewMode && (
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/scheduler')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au planificateur
          </Button>
          <h2 className="text-xl font-semibold">Consultation du rapport d'intervention</h2>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informations générales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="date">Date d'intervention</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date || ''}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  disabled={isViewMode}
                  required
                />
              </div>
              <div>
                <Label htmlFor="start_time">Heure de début</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time || ''}
                  onChange={(e) => handleInputChange('start_time', e.target.value)}
                  disabled={isViewMode}
                  required
                />
              </div>
              <div>
                <Label htmlFor="end_time">Heure de fin</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time || ''}
                  onChange={(e) => handleInputChange('end_time', e.target.value)}
                  disabled={isViewMode}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="auxiliary_name">Nom de l'auxiliaire</Label>
                <Input
                  id="auxiliary_name"
                  value={formData.auxiliary_name || ''}
                  onChange={(e) => handleInputChange('auxiliary_name', e.target.value)}
                  disabled={isViewMode}
                  placeholder="Nom et prénom de l'auxiliaire"
                  required
                />
              </div>
              <div>
                <Label htmlFor="patient_name">Nom du patient</Label>
                <Input
                  id="patient_name"
                  value={formData.patient_name || ''}
                  onChange={(e) => handleInputChange('patient_name', e.target.value)}
                  disabled={isViewMode}
                  placeholder="Nom et prénom du patient"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* État physique */}
        <Card>
          <CardHeader>
            <CardTitle>État physique</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>État général</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {physicalStateOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`physical-${option}`}
                      checked={(formData.physical_state || []).includes(option)}
                      onCheckedChange={(checked) => 
                        handleCheckboxChange('physical_state', option, checked as boolean)
                      }
                      disabled={isViewMode}
                    />
                    <Label htmlFor={`physical-${option}`} className="text-sm">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="physical_other">Autre (préciser)</Label>
              <Input
                id="physical_other"
                value={formData.physical_state_other || ''}
                onChange={(e) => handleInputChange('physical_state_other', e.target.value)}
                disabled={isViewMode}
                placeholder="Autres observations sur l'état physique"
              />
            </div>

            <div>
              <Label htmlFor="pain_location">Localisation de la douleur</Label>
              <Input
                id="pain_location"
                value={formData.pain_location || ''}
                onChange={(e) => handleInputChange('pain_location', e.target.value)}
                disabled={isViewMode}
                placeholder="Indiquer la localisation si douleur"
              />
            </div>
          </CardContent>
        </Card>

        {/* État mental */}
        <Card>
          <CardHeader>
            <CardTitle>État mental et comportement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>État mental</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {mentalStateOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`mental-${option}`}
                      checked={(formData.mental_state || []).includes(option)}
                      onCheckedChange={(checked) => 
                        handleCheckboxChange('mental_state', option, checked as boolean)
                      }
                      disabled={isViewMode}
                    />
                    <Label htmlFor={`mental-${option}`} className="text-sm">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="mental_change">Changements comportementaux</Label>
              <Textarea
                id="mental_change"
                value={formData.mental_state_change || ''}
                onChange={(e) => handleInputChange('mental_state_change', e.target.value)}
                disabled={isViewMode}
                placeholder="Décrire les changements observés"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Alimentation et hydratation */}
        <Card>
          <CardHeader>
            <CardTitle>Alimentation et hydratation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Appétit</Label>
                <RadioGroup
                  value={formData.appetite || ''}
                  onValueChange={(value) => handleInputChange('appetite', value)}
                  disabled={isViewMode}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bon" id="appetite-bon" />
                    <Label htmlFor="appetite-bon">Bon</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="moyen" id="appetite-moyen" />
                    <Label htmlFor="appetite-moyen">Moyen</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="faible" id="appetite-faible" />
                    <Label htmlFor="appetite-faible">Faible</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label>Hydratation</Label>
                <RadioGroup
                  value={formData.hydration || ''}
                  onValueChange={(value) => handleInputChange('hydration', value)}
                  disabled={isViewMode}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="suffisante" id="hydration-suffisante" />
                    <Label htmlFor="hydration-suffisante">Suffisante</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="insuffisante" id="hydration-insuffisante" />
                    <Label htmlFor="hydration-insuffisante">Insuffisante</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div>
              <Label htmlFor="appetite_comments">Commentaires sur l'alimentation</Label>
              <Textarea
                id="appetite_comments"
                value={formData.appetite_comments || ''}
                onChange={(e) => handleInputChange('appetite_comments', e.target.value)}
                disabled={isViewMode}
                placeholder="Détails sur les repas, difficultés..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Hygiène */}
        <Card>
          <CardHeader>
            <CardTitle>Hygiène et soins</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Soins prodigués</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {hygieneOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`hygiene-${option}`}
                      checked={(formData.hygiene || []).includes(option)}
                      onCheckedChange={(checked) => 
                        handleCheckboxChange('hygiene', option, checked as boolean)
                      }
                      disabled={isViewMode}
                    />
                    <Label htmlFor={`hygiene-${option}`} className="text-sm">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="hygiene_comments">Commentaires sur l'hygiène</Label>
              <Textarea
                id="hygiene_comments"
                value={formData.hygiene_comments || ''}
                onChange={(e) => handleInputChange('hygiene_comments', e.target.value)}
                disabled={isViewMode}
                placeholder="Précisions sur les soins effectués"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Activités */}
        <Card>
          <CardHeader>
            <CardTitle>Activités et stimulation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Activités réalisées</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {activitiesOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`activity-${option}`}
                      checked={(formData.activities || []).includes(option)}
                      onCheckedChange={(checked) => 
                        handleCheckboxChange('activities', option, checked as boolean)
                      }
                      disabled={isViewMode}
                    />
                    <Label htmlFor={`activity-${option}`} className="text-sm">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="activities_other">Autres activités</Label>
              <Input
                id="activities_other"
                value={formData.activities_other || ''}
                onChange={(e) => handleInputChange('activities_other', e.target.value)}
                disabled={isViewMode}
                placeholder="Autres activités non listées"
              />
            </div>
          </CardContent>
        </Card>

        {/* Observations générales */}
        <Card>
          <CardHeader>
            <CardTitle>Observations générales</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.observations || ''}
              onChange={(e) => handleInputChange('observations', e.target.value)}
              disabled={isViewMode}
              placeholder="Observations, incidents, particularités..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Suivi à prévoir */}
        <Card>
          <CardHeader>
            <CardTitle>Suivi et recommandations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Actions à prévoir</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {followUpOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`followup-${option}`}
                      checked={(formData.follow_up || []).includes(option)}
                      onCheckedChange={(checked) => 
                        handleCheckboxChange('follow_up', option, checked as boolean)
                      }
                      disabled={isViewMode}
                    />
                    <Label htmlFor={`followup-${option}`} className="text-sm">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="follow_up_other">Autres recommandations</Label>
              <Textarea
                id="follow_up_other"
                value={formData.follow_up_other || ''}
                onChange={(e) => handleInputChange('follow_up_other', e.target.value)}
                disabled={isViewMode}
                placeholder="Précisions sur le suivi nécessaire"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Enregistrement audio et médias */}
        {!isViewMode && (
          <Card>
            <CardHeader>
              <CardTitle>Enregistrement audio et médias</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Enregistrement vocal</Label>
                <VoiceRecorder onAudioChange={handleAudioChange} />
              </div>

              <div>
                <Label>Photos et documents</Label>
                <MediaUploader onUpload={handleMediaUpload} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Affichage des médias en mode consultation */}
        {isViewMode && formData.media_files && formData.media_files.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Médias attachés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {formData.media_files.map((media: any, index: number) => (
                  <div key={index} className="border rounded-lg p-2">
                    {media.type === 'image' && media.preview && (
                      <img 
                        src={media.preview} 
                        alt={`Média ${index + 1}`}
                        className="w-full h-32 object-cover rounded"
                      />
                    )}
                    <p className="text-sm text-gray-600 mt-2">
                      Type: {media.type}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Boutons d'action */}
        <div className="flex justify-end gap-4">
          {!isViewMode && (
            <Button type="submit" disabled={loading} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {loading ? 'Sauvegarde...' : (reportData?.id ? 'Mettre à jour' : 'Sauvegarder')}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default InterventionReportForm;
