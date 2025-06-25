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
import AppointmentSelector from './AppointmentSelector';
import VoiceRecorderForIntervention from './VoiceRecorderForIntervention';
import { Slider } from "@/components/ui/slider"

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

      const { data, error } = await supabase
        .from('intervention_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (error) throw error;

      setFormData({
        patientName: data.patient_name || '',
        auxiliaryName: data.auxiliary_name || '',
        date: data.date ? new Date(data.date) : undefined,
        startTime: data.start_time || '',
        endTime: data.end_time || '',
        hourlyRate: data.hourly_rate || null,
        activities: data.activities || [],
        activitiesOther: data.activities_other || null,
        physicalState: data.physical_state || [],
        physicalStateOther: data.physical_state_other || null,
        painLocation: data.pain_location || null,
        mentalState: data.mental_state || [],
        mentalStateChange: data.mental_state_change || null,
        hygiene: data.hygiene || [],
        hygieneComments: data.hygiene_comments || null,
        appetite: data.appetite || null,
        appetiteComments: data.appetite_comments || null,
        hydration: data.hydration || null,
        observations: data.observations || null,
        followUp: data.follow_up || [],
        followUpOther: data.follow_up_other || null,
        mediaFiles: data.media_files || [],
        audio_url: data.audio_url || null,
        clientRating: data.client_rating || null,
        clientComments: data.client_comments || null,
      });

      setDate(data.date ? new Date(data.date) : undefined);

      // Charger le rendez-vous associé si intervention_report_id est présent
      if (data.appointment_id) {
        const { data: appointmentData, error: appointmentError } = await supabase
          .from('appointments')
          .select('*')
          .eq('id', data.appointment_id)
          .single();

        if (appointmentData && !appointmentError) {
          setSelectedAppointment(appointmentData);
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
        date: formData.date,
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="patientName">Nom du patient</Label>
              <Input
                type="text"
                id="patientName"
                value={formData.patientName}
                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="auxiliaryName">Nom de l'auxiliaire</Label>
              <Input
                type="text"
                id="auxiliaryName"
                value={formData.auxiliaryName}
                onChange={(e) => setFormData({ ...formData, auxiliaryName: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn(
                    'w-[240px] justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  {date ? format(date, 'PPP') : <span>Choisir une date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center" side="bottom">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  onDayClick={(date) => setFormData({ ...formData, date: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Heure de début</Label>
              <Input
                type="time"
                id="startTime"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endTime">Heure de fin</Label>
              <Input
                type="time"
                id="endTime"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="hourlyRate">Taux horaire (€)</Label>
            <Input
              type="number"
              id="hourlyRate"
              value={formData.hourlyRate || ''}
              onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value ? parseFloat(e.target.value) : null })}
            />
          </div>

          <div>
            <Label>Activités réalisées</Label>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="activity1"
                  checked={formData.activities.includes('Toilettage')}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      activities: checked
                        ? [...formData.activities, 'Toilettage']
                        : formData.activities.filter((item) => item !== 'Toilettage'),
                    })
                  }
                />
                <Label htmlFor="activity1">Toilettage</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="activity2"
                  checked={formData.activities.includes('Préparation des repas')}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      activities: checked
                        ? [...formData.activities, 'Préparation des repas']
                        : formData.activities.filter((item) => item !== 'Préparation des repas'),
                    })
                  }
                />
                <Label htmlFor="activity2">Préparation des repas</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="activity3"
                  checked={formData.activities.includes('Aide à la mobilité')}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      activities: checked
                        ? [...formData.activities, 'Aide à la mobilité']
                        : formData.activities.filter((item) => item !== 'Aide à la mobilité'),
                    })
                  }
                />
                <Label htmlFor="activity3">Aide à la mobilité</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="activity4"
                  checked={formData.activities.includes('Surveillance de la prise de médicaments')}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      activities: checked
                        ? [...formData.activities, 'Surveillance de la prise de médicaments']
                        : formData.activities.filter((item) => item !== 'Surveillance de la prise de médicaments'),
                    })
                  }
                />
                <Label htmlFor="activity4">Surveillance de la prise de médicaments</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="activity5"
                  checked={formData.activities.includes('Compagnie et conversation')}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      activities: checked
                        ? [...formData.activities, 'Compagnie et conversation']
                        : formData.activities.filter((item) => item !== 'Compagnie et conversation'),
                    })
                  }
                />
                <Label htmlFor="activity5">Compagnie et conversation</Label>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="activitiesOther">Autres activités</Label>
            <Textarea
              id="activitiesOther"
              placeholder="Précisez les autres activités réalisées"
              value={formData.activitiesOther || ''}
              onChange={(e) => setFormData({ ...formData, activitiesOther: e.target.value })}
            />
          </div>

          <div>
            <Label>État physique</Label>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="physicalState1"
                  checked={formData.physicalState.includes('Stable')}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      physicalState: checked
                        ? [...formData.physicalState, 'Stable']
                        : formData.physicalState.filter((item) => item !== 'Stable'),
                    })
                  }
                />
                <Label htmlFor="physicalState1">Stable</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="physicalState2"
                  checked={formData.physicalState.includes('Fatigue')}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      physicalState: checked
                        ? [...formData.physicalState, 'Fatigue']
                        : formData.physicalState.filter((item) => item !== 'Fatigue'),
                    })
                  }
                />
                <Label htmlFor="physicalState2">Fatigue</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="physicalState3"
                  checked={formData.physicalState.includes('Douleur')}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      physicalState: checked
                        ? [...formData.physicalState, 'Douleur']
                        : formData.physicalState.filter((item) => item !== 'Douleur'),
                    })
                  }
                />
                <Label htmlFor="physicalState3">Douleur</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="physicalState4"
                  checked={formData.physicalState.includes('Difficulté respiratoire')}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      physicalState: checked
                        ? [...formData.physicalState, 'Difficulté respiratoire']
                        : formData.physicalState.filter((item) => item !== 'Difficulté respiratoire'),
                    })
                  }
                />
                <Label htmlFor="physicalState4">Difficulté respiratoire</Label>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="physicalStateOther">Autres détails état physique</Label>
            <Textarea
              id="physicalStateOther"
              placeholder="Précisez l'état physique"
              value={formData.physicalStateOther || ''}
              onChange={(e) => setFormData({ ...formData, physicalStateOther: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="painLocation">Localisation de la douleur</Label>
            <Input
              type="text"
              id="painLocation"
              placeholder="Si douleur, précisez la localisation"
              value={formData.painLocation || ''}
              onChange={(e) => setFormData({ ...formData, painLocation: e.target.value })}
            />
          </div>

          <div>
            <Label>État mental</Label>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mentalState1"
                  checked={formData.mentalState.includes('Alerte')}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      mentalState: checked
                        ? [...formData.mentalState, 'Alerte']
                        : formData.mentalState.filter((item) => item !== 'Alerte'),
                    })
                  }
                />
                <Label htmlFor="mentalState1">Alerte</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mentalState2"
                  checked={formData.mentalState.includes('Confus')}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      mentalState: checked
                        ? [...formData.mentalState, 'Confus']
                        : formData.mentalState.filter((item) => item !== 'Confus'),
                    })
                  }
                />
                <Label htmlFor="mentalState2">Confus</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mentalState3"
                  checked={formData.mentalState.includes('Anxieux')}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      mentalState: checked
                        ? [...formData.mentalState, 'Anxieux']
                        : formData.mentalState.filter((item) => item !== 'Anxieux'),
                    })
                  }
                />
                <Label htmlFor="mentalState3">Anxieux</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mentalState4"
                  checked={formData.mentalState.includes('Agité')}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      mentalState: checked
                        ? [...formData.mentalState, 'Agité']
                        : formData.mentalState.filter((item) => item !== 'Agité'),
                    })
                  }
                />
                <Label htmlFor="mentalState4">Agité</Label>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="mentalStateChange">Changements état mental</Label>
            <Textarea
              id="mentalStateChange"
              placeholder="Décrivez les changements d'état mental"
              value={formData.mentalStateChange || ''}
              onChange={(e) => setFormData({ ...formData, mentalStateChange: e.target.value })}
            />
          </div>

          <div>
            <Label>Hygiène</Label>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hygiene1"
                  checked={formData.hygiene.includes('Réalisée')}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      hygiene: checked
                        ? [...formData.hygiene, 'Réalisée']
                        : formData.hygiene.filter((item) => item !== 'Réalisée'),
                    })
                  }
                />
                <Label htmlFor="hygiene1">Réalisée</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hygiene2"
                  checked={formData.hygiene.includes('Partielle')}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      hygiene: checked
                        ? [...formData.hygiene, 'Partielle']
                        : formData.hygiene.filter((item) => item !== 'Partielle'),
                    })
                  }
                />
                <Label htmlFor="hygiene2">Partielle</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hygiene3"
                  checked={formData.hygiene.includes('Refusée')}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      hygiene: checked
                        ? [...formData.hygiene, 'Refusée']
                        : formData.hygiene.filter((item) => item !== 'Refusée'),
                    })
                  }
                />
                <Label htmlFor="hygiene3">Refusée</Label>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="hygieneComments">Commentaires hygiène</Label>
            <Textarea
              id="hygieneComments"
              placeholder="Ajoutez des commentaires sur l'hygiène"
              value={formData.hygieneComments || ''}
              onChange={(e) => setFormData({ ...formData, hygieneComments: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="appetite">Appétit</Label>
              <Select onValueChange={(value) => setFormData({ ...formData, appetite: value })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner" defaultValue={formData.appetite || undefined} />
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
              <Select onValueChange={(value) => setFormData({ ...formData, hydration: value })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner" defaultValue={formData.hydration || undefined} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normale">Normale</SelectItem>
                  <SelectItem value="Faible">Faible</SelectItem>
                  <SelectItem value="Nulle">Nulle</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="appetiteComments">Commentaires appétit</Label>
            <Textarea
              id="appetiteComments"
              placeholder="Ajoutez des commentaires sur l'appétit"
              value={formData.appetiteComments || ''}
              onChange={(e) => setFormData({ ...formData, appetiteComments: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="observations">Observations générales</Label>
            <Textarea
              id="observations"
              placeholder="Ajoutez des observations générales"
              value={formData.observations || ''}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
            />
          </div>

          <div>
            <Label>Suivi nécessaire</Label>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="followUp1"
                  checked={formData.followUp.includes('Contact médecin traitant')}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      followUp: checked
                        ? [...formData.followUp, 'Contact médecin traitant']
                        : formData.followUp.filter((item) => item !== 'Contact médecin traitant'),
                    })
                  }
                />
                <Label htmlFor="followUp1">Contact médecin traitant</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="followUp2"
                  checked={formData.followUp.includes('Contact famille')}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      followUp: checked
                        ? [...formData.followUp, 'Contact famille']
                        : formData.followUp.filter((item) => item !== 'Contact famille'),
                    })
                  }
                />
                <Label htmlFor="followUp2">Contact famille</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="followUp3"
                  checked={formData.followUp.includes('Mise en place de matériel')}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      followUp: checked
                        ? [...formData.followUp, 'Mise en place de matériel']
                        : formData.followUp.filter((item) => item !== 'Mise en place de matériel'),
                    })
                  }
                />
                <Label htmlFor="followUp3">Mise en place de matériel</Label>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="followUpOther">Autres suivis</Label>
            <Textarea
              id="followUpOther"
              placeholder="Précisez les autres suivis nécessaires"
              value={formData.followUpOther || ''}
              onChange={(e) => setFormData({ ...formData, followUpOther: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="appointment">Rendez-vous</Label>
            <AppointmentSelector
              selectedAppointment={selectedAppointment}
              setSelectedAppointment={setSelectedAppointment}
              setSelectedAppointmentId={setSelectedAppointmentId}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientRating">Évaluation du client</Label>
            <Slider
              defaultValue={[formData.clientRating || 3]}
              max={5}
              min={1}
              step={1}
              onValueChange={(value) => setFormData({ ...formData, clientRating: value[0] })}
            />
            <p className="text-sm text-muted-foreground">
              Note actuelle: {formData.clientRating} / 5
            </p>
          </div>

          <div>
            <Label htmlFor="clientComments">Commentaires du client</Label>
            <Textarea
              id="clientComments"
              placeholder="Ajoutez des commentaires sur le client"
              value={formData.clientComments || ''}
              onChange={(e) => setFormData({ ...formData, clientComments: e.target.value })}
            />
          </div>
          
          {/* Section audio avec debugging amélioré */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Enregistrement vocal</Label>
            <VoiceRecorderForIntervention
              onAudioChange={handleAudioChange}
              reportId={reportId}
              existingAudioUrl={formData.audio_url}
              disabled={isSaving}
            />
            
            {/* Debug info pour l'audio */}
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              <p>Debug Audio:</p>
              <p>• formData.audio_url: "{formData.audio_url}" (type: {typeof formData.audio_url})</p>
              <p>• audioBlob: {audioBlob ? `${audioBlob.size} bytes` : 'null'}</p>
            </div>
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
