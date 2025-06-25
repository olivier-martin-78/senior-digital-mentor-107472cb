import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { FileText } from 'lucide-react';
import { Appointment } from '@/types/appointments';
import { AppointmentSelector } from './components/AppointmentSelector';
import VoiceRecorderForIntervention from './VoiceRecorderForIntervention';
import MediaUploader from './MediaUploader';
import MediaDisplayGrid from './MediaDisplayGrid';
import { Slider } from "@/components/ui/slider"
import { BasicInfoSection } from './form-sections/BasicInfoSection';
import { ActivitiesSection } from './form-sections/ActivitiesSection';
import { PhysicalStateSection } from './form-sections/PhysicalStateSection';
import { MentalStateSection } from './form-sections/MentalStateSection';
import { HygieneSection } from './form-sections/HygieneSection';
import { NutritionSection } from './form-sections/NutritionSection';
import { FollowUpSection } from './form-sections/FollowUpSection';
import { MediaSection } from './form-sections/MediaSection';
import { ClientEvaluationSection } from './form-sections/ClientEvaluationSection';

interface ReportFormData {
  patientName: string;
  auxiliaryName: string;
  date: Date | undefined;
  startTime: string;
  endTime: string;
  hourlyRate: number | null;
  activities: string[];
  activitiesOther: string | null;
  physicalState: string[];
  physicalStateOther: string | null;
  painLocation: string | null;
  mentalState: string[];
  mentalStateChange: string | null;
  hygiene: string[];
  hygieneComments: string | null;
  appetite: string | null;
  appetiteComments: string | null;
  hydration: string | null;
  observations: string | null;
  followUp: string[];
  followUpOther: string | null;
  mediaFiles: any[];
  audio_url: string | null;
  clientRating: number | null;
  clientComments: string | null;
}

const InterventionReportForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reportId = searchParams.get('report_id');

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ReportFormData>({
    patientName: '',
    auxiliaryName: '',
    date: undefined,
    startTime: '',
    endTime: '',
    hourlyRate: null,
    activities: [],
    activitiesOther: null,
    physicalState: [],
    physicalStateOther: null,
    painLocation: null,
    mentalState: [],
    mentalStateChange: null,
    hygiene: [],
    hygieneComments: null,
    appetite: null,
    appetiteComments: null,
    hydration: null,
    observations: null,
    followUp: [],
    followUpOther: null,
    mediaFiles: [],
    audio_url: null,
    clientRating: null,
    clientComments: null,
  });
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [date, setDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (reportId && user) {
      loadReport();
    } else {
      setLoading(false);
    }
  }, [reportId, user]);

  const loadReport = async () => {
    if (!reportId || !user) return;

    try {
      setLoading(true);

      console.log('🎯 FORM_LOAD - Chargement du rapport:', reportId);

      const { data, error } = await supabase
        .from('intervention_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (error) throw error;

      console.log('🎯 FORM_LOAD - Données du rapport chargées:', {
        reportId,
        hasAudioUrl: !!data.audio_url,
        audioUrl: data.audio_url,
        audioUrlType: typeof data.audio_url,
        audioUrlLength: data.audio_url?.length || 0,
        hasMediaFiles: !!data.media_files,
        mediaFilesCount: Array.isArray(data.media_files) ? data.media_files.length : 0
      });

      // Transformer les media_files pour l'affichage
      const transformedMediaFiles = Array.isArray(data.media_files) 
        ? data.media_files.map((media: any, index: number) => ({
            id: media.id || `media-${index}`,
            name: media.name || `Media ${index + 1}`,
            preview: media.preview,
            type: media.preview ? 'image' : 'document'
          }))
        : [];

      setFormData({
        patientName: data.patient_name || '',
        auxiliaryName: data.auxiliary_name || '',
        date: data.date ? new Date(data.date) : undefined,
        startTime: data.start_time || '',
        endTime: data.end_time || '',
        hourlyRate: data.hourly_rate || null,
        activities: Array.isArray(data.activities) ? data.activities : [],
        activitiesOther: data.activities_other || null,
        physicalState: Array.isArray(data.physical_state) ? data.physical_state : [],
        physicalStateOther: data.physical_state_other || null,
        painLocation: data.pain_location || null,
        mentalState: Array.isArray(data.mental_state) ? data.mental_state : [],
        mentalStateChange: data.mental_state_change || null,
        hygiene: Array.isArray(data.hygiene) ? data.hygiene : [],
        hygieneComments: data.hygiene_comments || null,
        appetite: data.appetite || null,
        appetiteComments: data.appetite_comments || null,
        hydration: data.hydration || null,
        observations: data.observations || null,
        followUp: Array.isArray(data.follow_up) ? data.follow_up : [],
        followUpOther: data.follow_up_other || null,
        mediaFiles: transformedMediaFiles,
        audio_url: data.audio_url || null,
        clientRating: data.client_rating || null,
        clientComments: data.client_comments || null,
      });

      setDate(data.date ? new Date(data.date) : undefined);

      // Charger le rendez-vous associé si appointment_id est présent
      if (data.appointment_id) {
        const { data: appointmentData, error: appointmentError } = await supabase
          .from('appointments')
          .select('*')
          .eq('id', data.appointment_id)
          .single();

        if (appointmentData && !appointmentError) {
          // Properly type cast the appointment data
          const appointmentWithTyping: Appointment = {
            ...appointmentData,
            caregivers: [], // Default empty array
            status: (appointmentData.status as 'scheduled' | 'completed' | 'cancelled') || 'scheduled',
            recurrence_type: appointmentData.recurrence_type as 'weekly' | 'monthly' | undefined
          };
          setSelectedAppointment(appointmentWithTyping);
          setSelectedAppointmentId(appointmentData.id);
        } else {
          console.error('Erreur lors du chargement du rendez-vous associé:', appointmentError);
        }
      }
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

  const handleMediaChange = (mediaFiles: any[]) => {
    setFormData(prev => ({ ...prev, mediaFiles }));
  };

  const handleRemoveMediaFile = (fileId: string) => {
    setFormData(prev => ({
      ...prev,
      mediaFiles: prev.mediaFiles.filter(file => file.id !== fileId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté pour sauvegarder',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);
      
      console.log('🎯 FORM_SUBMIT - Données à sauvegarder:', {
        reportId,
        hasAudioBlob: !!audioBlob,
        audioBlobSize: audioBlob?.size || 0,
        audioUrl: formData.audio_url,
        audioUrlType: typeof formData.audio_url,
        audioUrlLength: formData.audio_url?.length || 0,
        isEdit: !!reportId
      });

      const reportData = {
        patient_name: formData.patientName,
        auxiliary_name: formData.auxiliaryName,
        date: formData.date ? formData.date.toISOString().split('T')[0] : null,
        start_time: formData.startTime,
        end_time: formData.endTime,
        hourly_rate: formData.hourlyRate || null,
        activities: formData.activities,
        activities_other: formData.activitiesOther || null,
        physical_state: formData.physicalState,
        physical_state_other: formData.physicalStateOther || null,
        pain_location: formData.painLocation || null,
        mental_state: formData.mentalState,
        mental_state_change: formData.mentalStateChange || null,
        hygiene: formData.hygiene,
        hygiene_comments: formData.hygieneComments || null,
        appetite: formData.appetite || null,
        appetite_comments: formData.appetiteComments || null,
        hydration: formData.hydration || null,
        observations: formData.observations || null,
        follow_up: formData.followUp,
        follow_up_other: formData.followUpOther || null,
        media_files: formData.mediaFiles || [],
        professional_id: user.id,
        appointment_id: selectedAppointmentId || null,
        audio_url: formData.audio_url || null,
        client_rating: formData.clientRating || null,
        client_comments: formData.clientComments || null,
      };

      console.log('🎯 FORM_SUBMIT - reportData préparé avec audio_url:', {
        audio_url: reportData.audio_url,
        audio_url_type: typeof reportData.audio_url,
        audio_url_length: reportData.audio_url?.length || 0
      });

      let savedReportId = reportId;

      if (reportId) {
        // Mode édition
        console.log('🎯 FORM_SUBMIT - Mode édition, mise à jour du rapport:', reportId);
        
        const { error } = await supabase
          .from('intervention_reports')
          .update(reportData)
          .eq('id', reportId);

        if (error) {
          console.error('❌ FORM_SUBMIT - Erreur lors de la mise à jour:', error);
          throw error;
        }
        
        console.log('✅ FORM_SUBMIT - Rapport mis à jour avec succès');
      } else {
        // Mode création
        console.log('🎯 FORM_SUBMIT - Mode création, insertion nouveau rapport');
        
        const { data, error } = await supabase
          .from('intervention_reports')
          .insert(reportData)
          .select()
          .single();

        if (error) {
          console.error('❌ FORM_SUBMIT - Erreur lors de la création:', error);
          throw error;
        }
        
        console.log('✅ FORM_SUBMIT - Rapport créé avec succès:', data);
        savedReportId = data.id;
      }

      // Vérification post-sauvegarde
      const { data: verificationData, error: verificationError } = await supabase
        .from('intervention_reports')
        .select('audio_url')
        .eq('id', savedReportId)
        .single();

      console.log('🔍 FORM_SUBMIT - Vérification post-sauvegarde:', {
        reportId: savedReportId,
        savedAudioUrl: verificationData?.audio_url,
        savedAudioUrlType: typeof verificationData?.audio_url,
        savedAudioUrlLength: verificationData?.audio_url?.length || 0,
        verificationError
      });

      // Mettre à jour le rendez-vous si sélectionné
      if (selectedAppointmentId) {
        console.log('📅 FORM_SUBMIT - Mise à jour du rendez-vous:', selectedAppointmentId);
        
        const { error: appointmentError } = await supabase
          .from('appointments')
          .update({ 
            intervention_report_id: savedReportId,
            status: 'completed'
          })
          .eq('id', selectedAppointmentId);

        if (appointmentError) {
          console.error('❌ FORM_SUBMIT - Erreur mise à jour rendez-vous:', appointmentError);
        } else {
          console.log('✅ FORM_SUBMIT - Rendez-vous mis à jour');
        }
      }

      toast({
        title: 'Succès',
        description: 'Rapport sauvegardé avec succès',
      });

      // Rediriger vers la vue du rapport
      navigate(`/intervention-report?report_id=${savedReportId}`);
    } catch (error) {
      console.error('💥 FORM_SUBMIT - Erreur générale:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le rapport',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Fonction pour gérer les changements d'audio
  const handleAudioChange = (blob: Blob | null) => {
    console.log('🎯 AUDIO_CHANGE - Changement d\'audio:', {
      hasBlob: !!blob,
      blobSize: blob?.size || 0,
      currentAudioUrl: formData.audio_url
    });
    
    setAudioBlob(blob);
    
    // Si pas de blob, effacer l'URL audio
    if (!blob) {
      console.log('🎯 AUDIO_CHANGE - Suppression de l\'URL audio');
      setFormData(prev => ({ ...prev, audio_url: null }));
    }
  };

  // Fonction pour gérer les changements d'URL audio
  const handleAudioUrlChange = (url: string | null) => {
    console.log('🎯 AUDIO_URL_CHANGE - Changement d\'URL audio:', {
      newUrl: url,
      urlType: typeof url,
      urlLength: url?.length || 0,
      previousUrl: formData.audio_url
    });
    
    setFormData(prev => ({ ...prev, audio_url: url }));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {reportId ? 'Modifier le rapport d\'intervention' : 'Nouveau rapport d\'intervention'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <BasicInfoSection 
            formData={formData} 
            setFormData={setFormData}
            date={date}
            setDate={setDate}
          />

          <ActivitiesSection 
            formData={formData} 
            setFormData={setFormData}
          />

          <PhysicalStateSection 
            formData={formData} 
            setFormData={setFormData}
          />

          <MentalStateSection 
            formData={formData} 
            setFormData={setFormData}
          />

          <HygieneSection 
            formData={formData} 
            setFormData={setFormData}
          />

          <NutritionSection 
            formData={formData} 
            setFormData={setFormData}
          />

          <div>
            <Label htmlFor="observations">Observations générales</Label>
            <Textarea
              id="observations"
              placeholder="Ajoutez des observations générales"
              value={formData.observations || ''}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
            />
          </div>

          <FollowUpSection 
            formData={formData} 
            setFormData={setFormData}
          />

          <div>
            <Label htmlFor="appointment">Rendez-vous</Label>
            <AppointmentSelector
              selectedAppointment={selectedAppointment}
              selectedAppointmentId={selectedAppointmentId}
              onAppointmentChange={(appointmentId) => setSelectedAppointmentId(appointmentId)}
            />
          </div>

          <ClientEvaluationSection 
            formData={formData} 
            setFormData={setFormData}
          />

          <MediaSection 
            mediaFiles={formData.mediaFiles}
            onMediaChange={handleMediaChange}
            onRemoveFile={handleRemoveMediaFile}
          />
          
          {/* Section audio */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Enregistrement vocal</Label>
            <VoiceRecorderForIntervention
              onAudioChange={handleAudioChange}
              onAudioUrlChange={handleAudioUrlChange}
              reportId={reportId}
              existingAudioUrl={formData.audio_url}
              disabled={isSaving}
            />
          </div>

          <Button disabled={isSaving} className="w-full">
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default InterventionReportForm;
