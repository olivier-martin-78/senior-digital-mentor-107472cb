import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Mic, Upload, X } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate, useLocation } from 'react-router-dom';

interface MediaFile {
  name: string;
  url: string;
}

const InterventionReportForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [appointment, setAppointment] = useState<any>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      auxiliary_name: user?.email?.split('@')[0] || 'Auxiliaire',
      patient_name: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      start_time: '09:00',
      end_time: '11:00',
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
      hourly_rate: 0
    }
  });

  useEffect(() => {
    const state = location.state as any;
    if (state?.appointmentId) {
      loadAppointmentData(state.appointmentId);
    }
    if (state?.reportData) {
      setReportData(state.reportData);
      populateFormWithReportData(state.reportData);
    }
    if (state?.isViewMode) {
      setIsViewMode(true);
    }
    if (state?.clientName) {
      setValue('patient_name', state.clientName);
    }
    if (state?.appointmentData) {
      setValue('date', state.appointmentData.date);
      setValue('start_time', state.appointmentData.start_time);
      setValue('end_time', state.appointmentData.end_time);
    }
  }, [location.state, setValue]);

  const loadAppointmentData = async (appointmentId: string) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clients:client_id (
            id,
            first_name,
            last_name,
            hourly_rate
          )
        `)
        .eq('id', appointmentId)
        .single();

      if (error) throw error;

      setAppointment(data);
      if (data.clients) {
        setValue('patient_name', `${data.clients.first_name} ${data.clients.last_name}`);
        if (data.clients.hourly_rate) {
          setValue('hourly_rate', data.clients.hourly_rate);
        }
      }
      setValue('date', format(new Date(data.start_time), 'yyyy-MM-dd'));
      setValue('start_time', format(new Date(data.start_time), 'HH:mm'));
      setValue('end_time', format(new Date(data.end_time), 'HH:mm'));
    } catch (error) {
      console.error('Erreur lors du chargement du rendez-vous:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données du rendez-vous',
        variant: 'destructive',
      });
    }
  };

  const populateFormWithReportData = (data: any) => {
    Object.keys(data).forEach(key => {
      if (key !== 'id' && key !== 'created_at' && key !== 'updated_at' && key !== 'professional_id') {
        setValue(key as any, data[key]);
      }
    });
    
    if (data.audio_url) {
      setAudioUrl(data.audio_url);
    }
    
    if (data.media_files) {
      setMediaFiles(data.media_files);
    }
  };

  const onSubmit = async (formData: any) => {
    if (!user) return;

    setLoading(true);
    try {
      const reportPayload = {
        ...formData,
        professional_id: user.id,
        appointment_id: appointment?.id || null,
        audio_url: audioUrl || null,
        media_files: mediaFiles.length > 0 ? mediaFiles : null,
      };

      let savedReport;
      
      if (reportData?.id) {
        // Mise à jour d'un rapport existant
        const { data, error } = await supabase
          .from('intervention_reports')
          .update(reportPayload)
          .eq('id', reportData.id)
          .select()
          .single();

        if (error) throw error;
        savedReport = data;

        toast({
          title: 'Succès',
          description: 'Rapport d\'intervention mis à jour avec succès',
        });
      } else {
        // Création d'un nouveau rapport
        const { data, error } = await supabase
          .from('intervention_reports')
          .insert([reportPayload])
          .select()
          .single();

        if (error) throw error;
        savedReport = data;

        // Mettre à jour le rendez-vous avec l'ID du rapport
        if (appointment?.id) {
          await supabase
            .from('appointments')
            .update({ 
              intervention_report_id: savedReport.id,
              status: 'completed'
            })
            .eq('id', appointment.id);
        }

        toast({
          title: 'Succès',
          description: 'Rapport d\'intervention créé avec succès',
        });
      }

      navigate('/scheduler');
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

  const physicalStateOptions = [
    'Stable',
    'Fatigue',
    'Douleur',
    'Difficulté à se déplacer',
    'Chute',
    'Autre',
  ];

  const mentalStateOptions = [
    'Stable',
    'Confusion',
    'Anxiété',
    'Tristesse',
    'Agressivité',
  ];

  const hygieneOptions = [
    'Autonome',
    'Partielle',
    'Totale',
  ];

  const activitiesOptions = [
    'Lecture',
    'Marche',
    'Jeux',
    'Visites',
    'Autre',
  ];

  const followUpOptions = [
    'Médical',
    'Paramédical',
    'Social',
    'Autre',
  ];

  const handleAudioUpload = async (event: any) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const fileName = `audio-${Date.now()}.${file.name.split('.').pop()}`;
      const { data, error } = await supabase.storage
        .from('intervention-reports')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const audioUrl = `${supabase.storageUrl}/intervention-reports/${data.path}`;
      setAudioUrl(audioUrl);

      toast({
        title: 'Succès',
        description: 'Fichier audio enregistré avec succès',
      });
    } catch (error) {
      console.error('Erreur lors de l\'upload du fichier audio:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer le fichier audio',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: any) => {
    const files = Array.from(event.target.files);
    if (!files || files.length === 0) return;

    setLoading(true);
    try {
      const uploadPromises = files.map(async (file, index) => {
        const fileName = `media-${Date.now()}-${index}.${file.name.split('.').pop()}`;
        const { data, error } = await supabase.storage
          .from('intervention-reports')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        const fileUrl = `${supabase.storageUrl}/intervention-reports/${data.path}`;
        return { name: file.name, url: fileUrl };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setMediaFiles(prevFiles => [...prevFiles, ...uploadedFiles]);

      toast({
        title: 'Succès',
        description: 'Fichiers enregistrés avec succès',
      });
    } catch (error) {
      console.error('Erreur lors de l\'upload des fichiers:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer les fichiers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const removeMediaFile = (fileToRemove: MediaFile) => {
    setMediaFiles(prevFiles => prevFiles.filter(file => file.url !== fileToRemove.url));
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {isViewMode ? 'Visualisation du rapport d\'intervention' : 
           reportData ? 'Modification du rapport d\'intervention' : 
           'Nouveau rapport d\'intervention'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Section Informations générales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="auxiliary_name">Nom de l'auxiliaire</Label>
              <Input
                id="auxiliary_name"
                {...register('auxiliary_name', { required: 'Ce champ est requis' })}
                disabled={isViewMode}
              />
              {errors.auxiliary_name && (
                <p className="text-sm text-red-600">{errors.auxiliary_name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="patient_name">Nom du patient</Label>
              <Input
                id="patient_name"
                {...register('patient_name', { required: 'Ce champ est requis' })}
                disabled={isViewMode}
              />
              {errors.patient_name && (
                <p className="text-sm text-red-600">{errors.patient_name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="date">Date d'intervention</Label>
              <Input
                id="date"
                type="date"
                {...register('date', { required: 'Ce champ est requis' })}
                disabled={isViewMode}
              />
              {errors.date && (
                <p className="text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="hourly_rate">Prix horaire (€)</Label>
              <Input
                id="hourly_rate"
                type="number"
                step="0.01"
                min="0"
                {...register('hourly_rate')}
                disabled={isViewMode}
                placeholder="Tarif horaire"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_time">Heure de début</Label>
              <Input
                id="start_time"
                type="time"
                {...register('start_time', { required: 'Ce champ est requis' })}
                disabled={isViewMode}
              />
              {errors.start_time && (
                <p className="text-sm text-red-600">{errors.start_time.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="end_time">Heure de fin</Label>
              <Input
                id="end_time"
                type="time"
                {...register('end_time', { required: 'Ce champ est requis' })}
                disabled={isViewMode}
              />
              {errors.end_time && (
                <p className="text-sm text-red_600">{errors.end_time.message}</p>
              )}
            </div>
          </div>

          {/* Section État physique */}
          <div>
            <Label>État physique</Label>
            <div className="flex flex-col space-y-2">
              {physicalStateOptions.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`physical_state_${option}`}
                    {...register('physical_state')}
                    value={option}
                    disabled={isViewMode}
                  />
                  <Label htmlFor={`physical_state_${option}`}>{option}</Label>
                </div>
              ))}
              <Textarea
                id="physical_state_other"
                placeholder="Autres détails sur l'état physique"
                {...register('physical_state_other')}
                disabled={isViewMode}
              />
            </div>
          </div>

          {/* Section Localisation de la douleur */}
          <div>
            <Label htmlFor="pain_location">Localisation de la douleur</Label>
            <Input
              id="pain_location"
              {...register('pain_location')}
              disabled={isViewMode}
            />
          </div>

          {/* Section État mental */}
          <div>
            <Label>État mental</Label>
            <div className="flex flex-col space-y-2">
              {mentalStateOptions.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`mental_state_${option}`}
                    {...register('mental_state')}
                    value={option}
                    disabled={isViewMode}
                  />
                  <Label htmlFor={`mental_state_${option}`}>{option}</Label>
                </div>
              ))}
              <Textarea
                id="mental_state_change"
                placeholder="Changements d'état mental"
                {...register('mental_state_change')}
                disabled={isViewMode}
              />
            </div>
          </div>

          {/* Section Appétit et Hydratation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="appetite">Appétit</Label>
              <Select
                disabled={isViewMode}
                onValueChange={(value) => setValue('appetite', value)}
                defaultValue={watch('appetite')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner l'appétit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bon">Bon</SelectItem>
                  <SelectItem value="Moyen">Moyen</SelectItem>
                  <SelectItem value="Faible">Faible</SelectItem>
                  <SelectItem value="Nul">Nul</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="hydration">Hydratation</Label>
              <Select
                disabled={isViewMode}
                onValueChange={(value) => setValue('hydration', value)}
                defaultValue={watch('hydration')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner l'hydratation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bonne">Bonne</SelectItem>
                  <SelectItem value="Moyenne">Moyenne</SelectItem>
                  <SelectItem value="Faible">Faible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="appetite_comments">Commentaires sur l'appétit et l'hydratation</Label>
            <Textarea
              id="appetite_comments"
              placeholder="Commentaires supplémentaires..."
              {...register('appetite_comments')}
              disabled={isViewMode}
            />
          </div>

          {/* Section Hygiène */}
          <div>
            <Label>Hygiène</Label>
            <div className="flex flex-col space-y-2">
              {hygieneOptions.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`hygiene_${option}`}
                    {...register('hygiene')}
                    value={option}
                    disabled={isViewMode}
                  />
                  <Label htmlFor={`hygiene_${option}`}>{option}</Label>
                </div>
              ))}
              <Textarea
                id="hygiene_comments"
                placeholder="Commentaires sur l'hygiène"
                {...register('hygiene_comments')}
                disabled={isViewMode}
              />
            </div>
          </div>

          {/* Section Activités */}
          <div>
            <Label>Activités</Label>
            <div className="flex flex-col space-y-2">
              {activitiesOptions.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`activities_${option}`}
                    {...register('activities')}
                    value={option}
                    disabled={isViewMode}
                  />
                  <Label htmlFor={`activities_${option}`}>{option}</Label>
                </div>
              ))}
              <Textarea
                id="activities_other"
                placeholder="Autres activités"
                {...register('activities_other')}
                disabled={isViewMode}
              />
            </div>
          </div>

          {/* Section Observations */}
          <div>
            <Label htmlFor="observations">Observations</Label>
            <Textarea
              id="observations"
              placeholder="Observations générales"
              {...register('observations', { required: 'Ce champ est requis' })}
              disabled={isViewMode}
            />
            {errors.observations && (
              <p className="text-sm text-red-600">{errors.observations.message}</p>
            )}
          </div>

          {/* Section Suivi */}
          <div>
            <Label>Suivi</Label>
            <div className="flex flex-col space-y-2">
              {followUpOptions.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`follow_up_${option}`}
                    {...register('follow_up')}
                    value={option}
                    disabled={isViewMode}
                  />
                  <Label htmlFor={`follow_up_${option}`}>{option}</Label>
                </div>
              ))}
              <Textarea
                id="follow_up_other"
                placeholder="Autres suivis"
                {...register('follow_up_other')}
                disabled={isViewMode}
              />
            </div>
          </div>

          {/* Section Audio */}
          <div>
            <Label htmlFor="audio">Enregistrement audio</Label>
            <div className="flex items-center space-x-4">
              <Input
                type="file"
                id="audio"
                accept="audio/*"
                onChange={handleAudioUpload}
                disabled={isViewMode}
                className="hidden"
              />
              <Label htmlFor="audio" className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md">
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Télécharger un audio
                </div>
              </Label>
              {audioUrl && (
                <div className="flex items-center space-x-2">
                  <audio src={audioUrl} controls />
                  {!isViewMode && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setAudioUrl('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section Médias */}
          <div>
            <Label htmlFor="media">Médias (images, vidéos)</Label>
            <div className="flex items-center space-x-4">
              <Input
                type="file"
                id="media"
                accept="image/*, video/*"
                multiple
                onChange={handleFileUpload}
                disabled={isViewMode}
                className="hidden"
              />
              <Label htmlFor="media" className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Télécharger des fichiers
                </div>
              </Label>
            </div>
            {mediaFiles.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                {mediaFiles.map((file) => (
                  <div key={file.url} className="relative">
                    {file.url.match(/\.(jpeg|jpg|gif|png)$/) ? (
                      <img src={file.url} alt={file.name} className="w-full h-32 object-cover rounded-md" />
                    ) : (
                      <video src={file.url} controls className="w-full h-32 object-cover rounded-md" />
                    )}
                    {!isViewMode && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 bg-white/80 text-gray-900 shadow-sm"
                        onClick={() => removeMediaFile(file)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/scheduler')}
            >
              {isViewMode ? 'Retour' : 'Annuler'}
            </Button>
            {!isViewMode && (
              <Button type="submit" disabled={loading}>
                {loading ? 'Sauvegarde...' : reportData ? 'Mettre à jour' : 'Créer le rapport'}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default InterventionReportForm;
