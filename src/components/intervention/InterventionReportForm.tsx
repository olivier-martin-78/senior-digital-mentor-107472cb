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
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import InterventionAudioRecorder from './InterventionAudioRecorder';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ChevronDown } from 'lucide-react';
import VoiceRecorderForIntervention from './VoiceRecorderForIntervention';

const InterventionReportForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // Prioriser location.state.appointmentId puis searchParams
  const appointmentIdFromState = location.state?.appointmentId;
  const appointmentIdFromParams = searchParams.get('appointmentId');
  const appointmentId = appointmentIdFromState || appointmentIdFromParams;
  const reportId = searchParams.get('reportId');

  console.log('🔍 FORM - URL searchParams bruts:', Object.fromEntries(searchParams));
  console.log('🔍 FORM - appointmentIdFromState:', appointmentIdFromState);
  console.log('🔍 FORM - appointmentIdFromParams:', appointmentIdFromParams);
  console.log('🔍 FORM - appointmentId final utilisé:', appointmentId);
  console.log('🔍 FORM - reportId récupéré depuis searchParams:', reportId);
  console.log('🔍 FORM - location.state:', location.state);

  const [reportData, setReportData] = useState({
    auxiliary_name: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '11:00',
    patient_name: '',
    physical_state: [] as string[],
    physical_state_other: '',
    pain_location: '',
    mental_state: [] as string[],
    mental_state_change: '',
    appetite: '',
    hydration: '',
    appetite_comments: '',
    hygiene: [] as string[],
    hygiene_comments: '',
    activities: [] as string[],
    activities_other: '',
    observations: '',
    follow_up: [] as string[],
    follow_up_other: '',
    audio_url: '',
    hourly_rate: 0
  });
  const [loading, setLoading] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [pendingAudioUpload, setPendingAudioUpload] = useState(false);
  const [intervenants, setIntervenants] = useState<any[]>([]);
  const [openSections, setOpenSections] = useState({
    general: true,
    physical: true,
    mental: true,
    nutrition: true,
    hygiene: true,
    activities: true,
    observations: true,
    followUp: true
  });

  const physicalStateOptions = [
    'Bien', 'Fatigué(e)', 'Douloureux/se', 'Essoufflé(e)', 'Difficultés de mobilité', 'Chutes', 'Autre'
  ];

  const mentalStateOptions = [
    'Calme', 'Anxieux/se', 'Confus(e)', 'Agité(e)', 'Triste', 'Joyeux/se', 'Désorienté(e)'
  ];

  const hygieneOptions = [
    'Toilette complète', 'Toilette partielle', 'Aide au lever/coucher', 'Change', 'Soins des pieds', 'Coiffure', 'Rasage'
  ];

  const activitiesOptions = [
    'Promenade', 'Lecture', 'Télévision', 'Jeux', 'Exercices', 'Sortie', 'Visite médicale', 'Courses'
  ];

  const followUpOptions = [
    'RAS', 'Signaler à la famille', 'Prévenir le médecin', 'Renouveler ordonnance', 'Prendre RDV', 'Surveillance particulière'
  ];

  useEffect(() => {
    console.log('🔍 FORM - useEffect déclenché avec:', { reportId, appointmentId, locationState: location.state });
    
    // Préremplir avec les données de l'état de navigation si disponibles
    if (location.state?.prefilledData) {
      const prefilledData = location.state.prefilledData;
      console.log('🔍 FORM - Préremplissage avec prefilledData:', prefilledData);
      setReportData(prev => ({
        ...prev,
        ...prefilledData
      }));
    } else if (reportId) {
      console.log('🔍 FORM - Chargement du rapport existant:', reportId);
      loadReportData(reportId);
    } else if (appointmentId) {
      console.log('🔍 FORM - Chargement des données du rendez-vous:', appointmentId);
      loadAppointmentData(appointmentId);
    }
  }, [reportId, appointmentId, location.state]);

  useEffect(() => {
    const loadIntervenants = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('intervenants')
          .select('*')
          .eq('created_by', user.id)
          .eq('active', true)
          .order('first_name', { ascending: true });

        if (error) {
          console.error('Erreur lors du chargement des intervenants:', error);
          return;
        }

        setIntervenants(data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des intervenants:', error);
      }
    };

    loadIntervenants();
  }, [user]);

  const loadReportData = async (reportId: string) => {
    setLoading(true);
    try {
      console.log('🔍 FORM - Chargement rapport avec ID:', reportId);
      
      const { data, error } = await supabase
        .from('intervention_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (error) {
        console.error('🔍 FORM - Erreur chargement rapport:', error);
        throw error;
      }

      if (data) {
        console.log('🔍 FORM - Données rapport chargées:', data);
        
        setReportData({
          auxiliary_name: data.auxiliary_name || '',
          date: data.date || new Date().toISOString().split('T')[0],
          start_time: data.start_time || '09:00',
          end_time: data.end_time || '11:00',
          patient_name: data.patient_name || '',
          physical_state: data.physical_state || [],
          physical_state_other: data.physical_state_other || '',
          pain_location: data.pain_location || '',
          mental_state: data.mental_state || [],
          mental_state_change: data.mental_state_change || '',
          appetite: data.appetite || '',
          hydration: data.hydration || '',
          appetite_comments: data.appetite_comments || '',
          hygiene: data.hygiene || [],
          hygiene_comments: data.hygiene_comments || '',
          activities: data.activities || [],
          activities_other: data.activities_other || '',
          observations: data.observations || '',
          follow_up: data.follow_up || [],
          follow_up_other: data.follow_up_other || '',
          audio_url: data.audio_url || '',
          hourly_rate: data.hourly_rate || 0
        });
      } else {
        console.log('🔍 FORM - Aucune donnée trouvée pour le rapport');
      }
    } catch (error) {
      console.error('🔍 FORM - Erreur lors du chargement du rapport:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger le rapport',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAppointmentData = async (appointmentId: string) => {
    try {
      const { data: appointment, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clients:client_id (
            first_name,
            last_name,
            hourly_rate
          )
        `)
        .eq('id', appointmentId)
        .single();

      if (error) throw error;

      if (appointment) {
        const startDate = new Date(appointment.start_time);
        const endDate = new Date(appointment.end_time);
        
        setReportData(prev => ({
          ...prev,
          date: startDate.toISOString().split('T')[0],
          start_time: startDate.toTimeString().slice(0, 5),
          end_time: endDate.toTimeString().slice(0, 5),
          patient_name: appointment.clients ? `${appointment.clients.first_name} ${appointment.clients.last_name}` : '',
          hourly_rate: appointment.clients?.hourly_rate || 0,
          observations: appointment.notes || ''
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données du rendez-vous:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setReportData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (field: string, value: string, checked: boolean) => {
    setReportData(prev => ({
      ...prev,
      [field]: checked 
        ? [...(prev[field] as string[]), value]
        : (prev[field] as string[]).filter(item => item !== value)
    }));
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleAudioRecorded = (blob: Blob) => {
    console.log('Audio recorded, storing blob:', blob.size);
    setAudioBlob(blob);
    if (blob.size === 0) {
      setReportData(prev => ({ ...prev, audio_url: '' }));
    }
  };

  const handleAudioUrlGenerated = (url: string) => {
    console.log('Audio URL generated:', url);
    setReportData(prev => ({ ...prev, audio_url: url }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    console.log('🔍 FORM - Début de handleSubmit');
    console.log('🔍 FORM - appointmentId avant traitement:', appointmentId);
    console.log('🔍 FORM - reportId avant traitement:', reportId);

    setLoading(true);
    try {
      const data = {
        ...reportData,
        professional_id: user.id,
        appointment_id: appointmentId || null,
      };

      console.log('🔍 FORM - appointmentId dans les données:', data.appointment_id);
      console.log('🔍 FORM - Données complètes à sauvegarder:', data);

      let savedReportId = reportId;

      if (reportId) {
        console.log('🔍 FORM - Mise à jour du rapport existant:', reportId);
        const { error } = await supabase
          .from('intervention_reports')
          .update(data)
          .eq('id', reportId);

        if (error) {
          console.error('🔍 FORM - Erreur lors de la mise à jour:', error);
          throw error;
        }

        toast({
          title: 'Succès',
          description: 'Rapport modifié avec succès',
        });
      } else {
        console.log('🔍 FORM - Création d\'un nouveau rapport');
        console.log('🔍 FORM - Données à insérer dans intervention_reports:', data);
        
        const { data: insertedData, error } = await supabase
          .from('intervention_reports')
          .insert([data])
          .select()
          .single();

        if (error) {
          console.error('🔍 FORM - Erreur lors de l\'insertion:', error);
          console.error('🔍 FORM - Détails de l\'erreur:', { 
            message: error.message, 
            details: error.details, 
            hint: error.hint,
            code: error.code 
          });
          throw error;
        }

        console.log('🔍 FORM - Rapport inséré avec succès:', insertedData);
        savedReportId = insertedData.id;
        console.log('🔍 FORM - savedReportId assigné:', savedReportId);

        // Vérifier que le rapport a bien été créé avec l'appointment_id
        const { data: verificationData, error: verificationError } = await supabase
          .from('intervention_reports')
          .select('id, appointment_id')
          .eq('id', savedReportId)
          .single();

        if (verificationError) {
          console.error('🔍 FORM - Erreur lors de la vérification:', verificationError);
        } else {
          console.log('🔍 FORM - Vérification du rapport créé:', verificationData);
        }

        // Mettre à jour le rendez-vous avec l'ID du rapport d'intervention
        if (appointmentId && savedReportId) {
          console.log('🔍 FORM - Mise à jour de l\'appointment avec intervention_report_id');
          console.log('🔍 FORM - appointmentId:', appointmentId, 'savedReportId:', savedReportId);
          
          const { data: updateData, error: updateError } = await supabase
            .from('appointments')
            .update({ intervention_report_id: savedReportId })
            .eq('id', appointmentId)
            .select();

          if (updateError) {
            console.error('🔍 FORM - Erreur lors de la mise à jour du rendez-vous:', updateError);
            console.error('🔍 FORM - Détails de l\'erreur update:', { 
              message: updateError.message, 
              details: updateError.details, 
              hint: updateError.hint,
              code: updateError.code 
            });
          } else {
            console.log('🔍 FORM - Rendez-vous mis à jour avec succès:', updateData);
          }
        } else {
          console.log('🔍 FORM - Pas de mise à jour du rendez-vous car:', { 
            appointmentId, 
            savedReportId,
            hasAppointmentId: !!appointmentId,
            hasSavedReportId: !!savedReportId
          });
        }

        toast({
          title: 'Succès',
          description: 'Rapport créé avec succès',
        });
      }

      // Si on a un blob audio en attente et maintenant un reportId, uploader l'audio
      if (audioBlob && audioBlob.size > 0 && savedReportId && !reportData.audio_url) {
        setPendingAudioUpload(true);
        // L'upload sera géré par le composant InterventionAudioRecorder
        // via les props onAudioRecorded et reportId
      }

      navigate('/scheduler');
    } catch (error) {
      console.error('🔍 FORM - Erreur générale lors de la sauvegarde du rapport:', error);
      toast({
        title: 'Erreur',
        description: `Impossible de sauvegarder le rapport: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setPendingAudioUpload(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Chargement du rapport...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Rapport d'Intervention</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Section Informations générales */}
            <Collapsible open={openSections.general} onOpenChange={() => toggleSection('general')}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold">Informations générales</h3>
                <ChevronDown className={`h-4 w-4 transition-transform ${openSections.general ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="patient_name">Nom du patient</Label>
                    <Input
                      id="patient_name"
                      name="patient_name"
                      value={reportData.patient_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="auxiliary_name">Intervenant</Label>
                    <select
                      id="auxiliary_name"
                      name="auxiliary_name"
                      value={reportData.auxiliary_name}
                      onChange={(e) => setReportData(prev => ({ ...prev, auxiliary_name: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      <option value="">Sélectionner un intervenant</option>
                      {intervenants.map((intervenant) => (
                        <option key={intervenant.id} value={`${intervenant.first_name} ${intervenant.last_name}`}>
                          {intervenant.first_name} {intervenant.last_name}
                          {intervenant.speciality && ` - ${intervenant.speciality}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      value={reportData.date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="start_time">Heure de début</Label>
                    <Input
                      id="start_time"
                      name="start_time"
                      type="time"
                      value={reportData.start_time}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="end_time">Heure de fin</Label>
                    <Input
                      id="end_time"
                      name="end_time"
                      type="time"
                      value={reportData.end_time}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="hourly_rate">Tarif horaire (€)</Label>
                  <Input
                    id="hourly_rate"
                    name="hourly_rate"
                    type="number"
                    step="0.01"
                    value={reportData.hourly_rate}
                    onChange={handleInputChange}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* Section État physique */}
            <Collapsible open={openSections.physical} onOpenChange={() => toggleSection('physical')}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold">État physique</h3>
                <ChevronDown className={`h-4 w-4 transition-transform ${openSections.physical ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4">
                <div>
                  <Label>État physique observé</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {physicalStateOptions.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          id={`physical_${option}`}
                          checked={reportData.physical_state.includes(option)}
                          onCheckedChange={(checked) => 
                            handleCheckboxChange('physical_state', option, checked as boolean)
                          }
                        />
                        <Label htmlFor={`physical_${option}`} className="text-sm">{option}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {reportData.physical_state.includes('Autre') && (
                  <div>
                    <Label htmlFor="physical_state_other">Précisions sur l'état physique</Label>
                    <Input
                      id="physical_state_other"
                      name="physical_state_other"
                      value={reportData.physical_state_other}
                      onChange={handleInputChange}
                      placeholder="Précisez l'état physique observé"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="pain_location">Localisation des douleurs</Label>
                  <Input
                    id="pain_location"
                    name="pain_location"
                    value={reportData.pain_location}
                    onChange={handleInputChange}
                    placeholder="Précisez la localisation des douleurs si applicable"
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* Section État mental */}
            <Collapsible open={openSections.mental} onOpenChange={() => toggleSection('mental')}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold">État mental et comportement</h3>
                <ChevronDown className={`h-4 w-4 transition-transform ${openSections.mental ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4">
                <div>
                  <Label>État mental observé</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {mentalStateOptions.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          id={`mental_${option}`}
                          checked={reportData.mental_state.includes(option)}
                          onCheckedChange={(checked) => 
                            handleCheckboxChange('mental_state', option, checked as boolean)
                          }
                        />
                        <Label htmlFor={`mental_${option}`} className="text-sm">{option}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="mental_state_change">Évolution de l'état mental</Label>
                  <Textarea
                    id="mental_state_change"
                    name="mental_state_change"
                    value={reportData.mental_state_change}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Décrivez les changements observés dans l'état mental ou le comportement"
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* Section Alimentation et hydratation */}
            <Collapsible open={openSections.nutrition} onOpenChange={() => toggleSection('nutrition')}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold">Alimentation et hydratation</h3>
                <ChevronDown className={`h-4 w-4 transition-transform ${openSections.nutrition ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="appetite">Appétit</Label>
                    <RadioGroup value={reportData.appetite} onValueChange={(value) => 
                      setReportData(prev => ({ ...prev, appetite: value }))
                    }>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="bon" id="appetite_bon" />
                        <Label htmlFor="appetite_bon">Bon</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="moyen" id="appetite_moyen" />
                        <Label htmlFor="appetite_moyen">Moyen</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="faible" id="appetite_faible" />
                        <Label htmlFor="appetite_faible">Faible</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="refuse" id="appetite_refuse" />
                        <Label htmlFor="appetite_refuse">Refuse de manger</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label htmlFor="hydration">Hydratation</Label>
                    <RadioGroup value={reportData.hydration} onValueChange={(value) => 
                      setReportData(prev => ({ ...prev, hydration: value }))
                    }>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="suffisante" id="hydration_suffisante" />
                        <Label htmlFor="hydration_suffisante">Suffisante</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="insuffisante" id="hydration_insuffisante" />
                        <Label htmlFor="hydration_insuffisante">Insuffisante</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="refuse" id="hydration_refuse" />
                        <Label htmlFor="hydration_refuse">Refuse de boire</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div>
                  <Label htmlFor="appetite_comments">Commentaires sur l'alimentation et l'hydratation</Label>
                  <Textarea
                    id="appetite_comments"
                    name="appetite_comments"
                    value={reportData.appetite_comments}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Précisions sur les repas, quantités, préférences, difficultés..."
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* Section Hygiène */}
            <Collapsible open={openSections.hygiene} onOpenChange={() => toggleSection('hygiene')}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold">Hygiène et soins</h3>
                <ChevronDown className={`h-4 w-4 transition-transform ${openSections.hygiene ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4">
                <div>
                  <Label>Soins d'hygiène réalisés</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {hygieneOptions.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          id={`hygiene_${option}`}
                          checked={reportData.hygiene.includes(option)}
                          onCheckedChange={(checked) => 
                            handleCheckboxChange('hygiene', option, checked as boolean)
                          }
                        />
                        <Label htmlFor={`hygiene_${option}`} className="text-sm">{option}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="hygiene_comments">Commentaires sur l'hygiène</Label>
                  <Textarea
                    id="hygiene_comments"
                    name="hygiene_comments"
                    value={reportData.hygiene_comments}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Précisions sur les soins réalisés, difficultés rencontrées, état de la peau..."
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* Section Activités */}
            <Collapsible open={openSections.activities} onOpenChange={() => toggleSection('activities')}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold">Activités et animation</h3>
                <ChevronDown className={`h-4 w-4 transition-transform ${openSections.activities ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4">
                <div>
                  <Label>Activités réalisées</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {activitiesOptions.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          id={`activity_${option}`}
                          checked={reportData.activities.includes(option)}
                          onCheckedChange={(checked) => 
                            handleCheckboxChange('activities', option, checked as boolean)
                          }
                        />
                        <Label htmlFor={`activity_${option}`} className="text-sm">{option}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="activities_other">Autres activités</Label>
                  <Input
                    id="activities_other"
                    name="activities_other"
                    value={reportData.activities_other}
                    onChange={handleInputChange}
                    placeholder="Décrivez les autres activités réalisées"
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* Section Observations */}
            <Collapsible open={openSections.observations} onOpenChange={() => toggleSection('observations')}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold">Observations générales</h3>
                <ChevronDown className={`h-4 w-4 transition-transform ${openSections.observations ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="observations">Observations et remarques</Label>
                  <Textarea
                    id="observations"
                    name="observations"
                    value={reportData.observations}
                    onChange={handleInputChange}
                    rows={5}
                    placeholder="Observations générales, événements particuliers, évolution de l'état de santé..."
                  />
                </div>

                <div>
                  <Label>Enregistrement audio (optionnel)</Label>
                  <VoiceRecorderForIntervention
                    onAudioChange={handleAudioRecorded}
                    reportId={reportId || undefined}
                  />
                  {pendingAudioUpload && (
                    <p className="text-sm text-blue-600 mt-2">
                      ⏳ Upload audio en attente après sauvegarde du rapport...
                    </p>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* Section Suivi */}
            <Collapsible open={openSections.followUp} onOpenChange={() => toggleSection('followUp')}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold">Suivi et recommandations</h3>
                <ChevronDown className={`h-4 w-4 transition-transform ${openSections.followUp ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4">
                <div>
                  <Label>Actions de suivi</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    {followUpOptions.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          id={`followup_${option}`}
                          checked={reportData.follow_up.includes(option)}
                          onCheckedChange={(checked) => 
                            handleCheckboxChange('follow_up', option, checked as boolean)
                          }
                        />
                        <Label htmlFor={`followup_${option}`} className="text-sm">{option}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="follow_up_other">Autres recommandations</Label>
                  <Textarea
                    id="follow_up_other"
                    name="follow_up_other"
                    value={reportData.follow_up_other}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Autres actions de suivi, recommandations spécifiques..."
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="flex justify-end pt-6">
              <Button type="submit" disabled={loading} className="min-w-32">
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
