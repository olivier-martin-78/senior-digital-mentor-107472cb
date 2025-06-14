import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { FileText, Save, ArrowLeft, Upload, X } from 'lucide-react';
import { Client, Appointment, Intervenant } from '@/types/appointments';
import { MediaUploader } from './MediaUploader';
import SimpleInterventionAudioRecorder from './SimpleInterventionAudioRecorder';

const InterventionReportForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reportId = searchParams.get('report_id');
  const appointmentId = searchParams.get('appointment_id');

  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [allIntervenants, setAllIntervenants] = useState<Intervenant[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showAppointmentSelector, setShowAppointmentSelector] = useState(false);

  const [formData, setFormData] = useState({
    appointment_id: appointmentId || '',
    patient_name: '',
    auxiliary_name: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    activities: [] as string[],
    activities_other: '',
    physical_state: [] as string[],
    physical_state_other: '',
    pain_location: '',
    mental_state: [] as string[],
    mental_state_change: '',
    hygiene: [] as string[],
    hygiene_comments: '',
    appetite: '',
    appetite_comments: '',
    hydration: '',
    observations: '',
    follow_up: [] as string[],
    follow_up_other: '',
    hourly_rate: '',
    media_files: [] as any[],
    audio_url: '',
  });

  useEffect(() => {
    loadData();
  }, [user, reportId, appointmentId]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoadingData(true);
      console.log('🔍 INTERVENTION_FORM V2 - Début du chargement avec politiques RLS corrigées');
      console.log('🔍 INTERVENTION_FORM V2 - reportId:', reportId);
      console.log('🔍 INTERVENTION_FORM V2 - appointmentId:', appointmentId);
      console.log('🔍 INTERVENTION_FORM V2 - userId:', user.id);
      console.log('🔍 INTERVENTION_FORM V2 - userEmail:', user.email);
      
      // Charger les clients créés par le professionnel
      const { data: allClients, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('created_by', user.id);

      if (clientError) {
        console.error('🔍 INTERVENTION_FORM V2 - Erreur clients:', clientError);
      }

      const authorizedClients: Client[] = allClients || [];
      console.log('🔍 INTERVENTION_FORM V2 - Clients chargés:', authorizedClients.length);
      setClients(authorizedClients);

      // Charger les rendez-vous (maintenant avec les nouvelles politiques RLS v11)
      const loadedAppointments = await loadAppointments();
      
      // Charger les intervenants autorisés
      await loadIntervenants();

      // Si on édite un rapport existant, le charger APRÈS avoir chargé les rendez-vous
      if (reportId) {
        console.log('🔍 INTERVENTION_FORM V2 - Chargement du rapport existant...');
        await loadExistingReport(loadedAppointments);
      } else if (appointmentId && loadedAppointments.length > 0) {
        // Si on crée un nouveau rapport avec un appointmentId depuis l'URL
        console.log('🔍 INTERVENTION_FORM V2 - Nouveau rapport avec appointmentId depuis URL:', appointmentId);
        const foundAppointment = loadedAppointments.find(apt => apt.id === appointmentId);
        if (foundAppointment) {
          console.log('🔍 INTERVENTION_FORM V2 - Rendez-vous trouvé pour nouveau rapport:', foundAppointment);
          handleAppointmentChange(appointmentId, loadedAppointments);
        } else {
          console.log('🔍 INTERVENTION_FORM V2 - Rendez-vous non trouvé ou accès non autorisé via RLS v11');
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données',
        variant: 'destructive',
      });
    } finally {
      setLoadingData(false);
    }
  };

  const loadAppointments = async () => {
    if (!user) {
      console.log('🔍 INTERVENTION_FORM V2 - Pas d\'utilisateur');
      setAppointments([]);
      return [];
    }

    console.log('🔍 INTERVENTION_FORM V2 - Chargement des rendez-vous avec politiques RLS v11...');
    
    // Avec les nouvelles politiques RLS v11, cette requête utilisera les nouvelles règles sécurisées
    const { data: userAppointments, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        clients:client_id (
          id, first_name, last_name, address, phone, email, color, hourly_rate, created_at, updated_at, created_by
        ),
        intervenants:intervenant_id (
          id, first_name, last_name, email, phone, speciality, active, created_at, updated_at, created_by
        )
      `);

    if (appointmentError) {
      console.error('🔍 INTERVENTION_FORM V2 - Erreur rendez-vous:', appointmentError);
      setAppointments([]);
      return [];
    }

    // Transformer les données
    const transformedAppointments = (userAppointments || []).map(item => ({
      ...item,
      status: item.status as 'scheduled' | 'completed' | 'cancelled',
      recurrence_type: item.recurrence_type as 'weekly' | 'monthly' | undefined,
      client: item.clients,
      intervenant: item.intervenants,
      caregivers: []
    }));

    console.log('🔍 INTERVENTION_FORM V2 - Total rendez-vous autorisés par RLS v11:', transformedAppointments.length);
    console.log('🔍 INTERVENTION_FORM V2 - IDs des rendez-vous:', transformedAppointments.map(apt => apt.id));
    setAppointments(transformedAppointments);

    // Après avoir chargé les rendez-vous, vérifier si on doit sélectionner un rendez-vous spécifique
    if (appointmentId && transformedAppointments.length > 0) {
      console.log('🔍 INTERVENTION_FORM V2 - Recherche du rendez-vous par URL:', appointmentId);
      const appointment = transformedAppointments.find(apt => apt.id === appointmentId);
      if (appointment) {
        console.log('🔍 INTERVENTION_FORM V2 - Rendez-vous trouvé par URL:', appointment);
        handleAppointmentChange(appointmentId, transformedAppointments);
      } else {
        console.log('🔍 INTERVENTION_FORM V2 - Rendez-vous non trouvé par URL (accès non autorisé via RLS v11)');
      }
    }

    return transformedAppointments;
  };

  const loadIntervenants = async () => {
    if (!user) return;

    console.log('🔍 INTERVENTION_FORM V2 - Chargement des intervenants...');
    
    // Charger les intervenants créés par le professionnel
    const { data: allIntervenantsData, error: intervenantError } = await supabase
      .from('intervenants')
      .select('*')
      .eq('created_by', user.id);

    if (intervenantError) {
      console.error('🔍 INTERVENTION_FORM V2 - Erreur intervenants:', intervenantError);
      return;
    }

    console.log('🔍 INTERVENTION_FORM V2 - Intervenants chargés:', allIntervenantsData?.length || 0);
    setAllIntervenants(allIntervenantsData || []);
  };

  const loadExistingReport = async (appointmentsList: Appointment[]) => {
    if (!reportId || !user) return;

    console.log('🔍 INTERVENTION_FORM V2 - Chargement du rapport ID:', reportId);
    console.log('🔍 INTERVENTION_FORM V2 - User ID:', user.id);
    console.log('🔍 INTERVENTION_FORM V2 - User Email:', user.email);

    try {
      // Avec les nouvelles politiques RLS v2, on peut charger directement le rapport
      // Les politiques permettent l'accès automatiquement si l'utilisateur est autorisé
      console.log('🔍 INTERVENTION_FORM V2 - Chargement direct via politiques RLS v2 corrigées');
      const { data: report, error } = await supabase
        .from('intervention_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (error) {
        console.error('🔍 INTERVENTION_FORM V2 - Erreur lors du chargement du rapport:', error);
        
        // Essayer de déboguer l'accès
        console.log('🔍 INTERVENTION_FORM V2 - Test de la fonction de debug...');
        const { data: debugResult, error: debugError } = await supabase.rpc(
          'debug_intervention_report_access', 
          { report_id_param: reportId }
        );
        
        if (debugError) {
          console.error('🔍 INTERVENTION_FORM V2 - Erreur debug:', debugError);
        } else {
          console.log('🔍 INTERVENTION_FORM V2 - Résultat debug:', debugResult);
        }
        
        toast({
          title: 'Erreur d\'accès',
          description: 'Impossible de charger ce rapport d\'intervention. Vérifiez vos autorisations.',
          variant: 'destructive',
        });
        return;
      }

      if (report) {
        console.log('🔍 INTERVENTION_FORM V2 - Rapport chargé avec succès:', report);
        console.log('🔍 INTERVENTION_FORM V2 - appointment_id du rapport:', report.appointment_id);
        
        setFormData({
          appointment_id: report.appointment_id || '',
          patient_name: report.patient_name || '',
          auxiliary_name: report.auxiliary_name || '',
          date: report.date || '',
          start_time: report.start_time || '',
          end_time: report.end_time || '',
          activities: Array.isArray(report.activities) ? report.activities : [],
          activities_other: report.activities_other || '',
          physical_state: Array.isArray(report.physical_state) ? report.physical_state : [],
          physical_state_other: report.physical_state_other || '',
          pain_location: report.pain_location || '',
          mental_state: Array.isArray(report.mental_state) ? report.mental_state : [],
          mental_state_change: report.mental_state_change || '',
          hygiene: Array.isArray(report.hygiene) ? report.hygiene : [],
          hygiene_comments: report.hygiene_comments || '',
          appetite: report.appetite || '',
          appetite_comments: report.appetite_comments || '',
          hydration: report.hydration || '',
          observations: report.observations || '',
          follow_up: Array.isArray(report.follow_up) ? report.follow_up : [],
          follow_up_other: report.follow_up_other || '',
          hourly_rate: report.hourly_rate?.toString() || '',
          media_files: Array.isArray(report.media_files) ? report.media_files : [],
          audio_url: report.audio_url || '',
        });

        // Si le rapport a un appointment_id, chercher le rendez-vous correspondant
        if (report.appointment_id && appointmentsList.length > 0) {
          console.log('🔍 INTERVENTION_FORM V2 - Recherche du rendez-vous associé:', report.appointment_id);
          const foundAppointment = appointmentsList.find(apt => apt.id === report.appointment_id);
          if (foundAppointment) {
            console.log('🔍 INTERVENTION_FORM V2 - Rendez-vous associé trouvé:', foundAppointment);
            setSelectedAppointment(foundAppointment);
          } else {
            console.log('🔍 INTERVENTION_FORM V2 - Rendez-vous associé non trouvé - accès non autorisé via RLS v11');
          }
        } else {
          console.log('🔍 INTERVENTION_FORM V2 - Pas d\'appointment_id ou liste vide');
          // Si le rapport n'a pas d'appointment_id mais qu'il y a des rendez-vous disponibles,
          // permettre à l'utilisateur de sélectionner manuellement
          if (appointmentsList.length > 0) {
            setShowAppointmentSelector(true);
            console.log('🔍 INTERVENTION_FORM V2 - Affichage du sélecteur de rendez-vous');
          }
        }
      }
    } catch (error) {
      console.error('🔍 INTERVENTION_FORM V2 - Erreur inattendue lors du chargement:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur inattendue s\'est produite lors du chargement du rapport.',
        variant: 'destructive',
      });
    }
  };

  const handleAppointmentChange = (appointmentId: string, appointmentsList?: Appointment[]) => {
    const appointmentsToUse = appointmentsList || appointments;
    
    // Handle the special "none" value
    if (appointmentId === "none") {
      setSelectedAppointment(null);
      setFormData(prev => ({
        ...prev,
        appointment_id: '',
        // Keep other fields as they are
      }));
      return;
    }

    const appointment = appointmentsToUse.find(apt => apt.id === appointmentId);
    if (appointment) {
      console.log('🔍 INTERVENTION_FORM V2 - Rendez-vous sélectionné:', appointment);
      setSelectedAppointment(appointment);
      setShowAppointmentSelector(false);
      
      const startDate = new Date(appointment.start_time);
      const endDate = new Date(appointment.end_time);
      
      setFormData(prev => ({
        ...prev,
        appointment_id: appointmentId,
        patient_name: appointment.client ? `${appointment.client.first_name} ${appointment.client.last_name}` : '',
        auxiliary_name: appointment.intervenant ? `${appointment.intervenant.first_name} ${appointment.intervenant.last_name}` : 
                       (user?.email?.split('@')[0] || 'Auxiliaire'),
        date: startDate.toISOString().split('T')[0],
        start_time: startDate.toTimeString().slice(0, 5),
        end_time: endDate.toTimeString().slice(0, 5),
        hourly_rate: appointment.client?.hourly_rate?.toString() || '',
      }));
    } else {
      console.log('🔍 INTERVENTION_FORM V2 - Rendez-vous non trouvé pour ID:', appointmentId);
    }
  };

  const activitiesOptions = [
    { label: 'Aide à la mobilité', value: 'mobility' },
    { label: 'Préparation des repas', value: 'meals' },
    { label: 'Aide à la toilette', value: 'hygiene' },
    { label: 'Courses', value: 'groceries' },
    { label: 'Compagnie et conversation', value: 'company' },
    { label: 'Tâches ménagères légères', value: 'housekeeping' },
    { label: 'Suivi des médicaments', value: 'medication' },
    { label: 'Exercices physiques légers', value: 'exercises' },
    { label: 'Lecture', value: 'reading' },
    { label: 'Promenade', value: 'walk' },
    { label: 'Rendez-vous médicaux', value: 'appointments' },
  ];

  const physicalStateOptions = [
    { label: 'Stable', value: 'stable' },
    { label: 'Fatigué', value: 'tired' },
    { label: 'Agité', value: 'agitated' },
    { label: 'Douloureux', value: 'painful' },
    { label: 'Confus', value: 'confused' },
    { label: 'Vertiges', value: 'dizzy' },
    { label: 'Nausées', value: 'nauseous' },
    { label: 'Essoufflé', value: 'breathless' },
  ];

  const mentalStateOptions = [
    { label: 'Clair et alerte', value: 'clear' },
    { label: 'Légèrement confus', value: 'slightly_confused' },
    { label: 'Anxieux', value: 'anxious' },
    { label: 'Triste', value: 'sad' },
    { label: 'Irritable', value: 'irritable' },
    { label: 'Apathique', value: 'apathetic' },
    { label: 'Désorienté', value: 'disoriented' },
  ];

  const hygieneOptions = [
    { label: 'Autonome', value: 'autonomous' },
    { label: 'Partielle', value: 'partial' },
    { label: 'Totale', value: 'total' },
    { label: 'Refusée', value: 'refused' },
  ];

  const followUpOptions = [
    { label: 'Contacter la famille', value: 'contact_family' },
    { label: 'Contacter le médecin', value: 'contact_doctor' },
    { label: 'Surveiller les symptômes', value: 'monitor_symptoms' },
    { label: 'Ajuster les médicaments', value: 'adjust_medication' },
    { label: 'Planifier un rendez-vous', value: 'schedule_appointment' },
  ];

  const handleCheckboxChange = (group: string, value: string) => {
    setFormData(prev => {
      const currentValues = prev[group] as string[];
      if (currentValues.includes(value)) {
        return { ...prev, [group]: currentValues.filter(v => v !== value) };
      } else {
        return { ...prev, [group]: [...currentValues, value] };
      }
    });
  };

  const handleMediaUpload = (files: any[]) => {
    setFormData(prev => ({ ...prev, media_files: [...prev.media_files, ...files] }));
  };

  const handleMediaRemove = (fileToRemove: any) => {
    setFormData(prev => ({
      ...prev,
      media_files: prev.media_files.filter(file => file !== fileToRemove),
    }));
  };

  const handleAudioUpload = (audioBlob: Blob | null, audioUrl: string | null) => {
    setFormData(prev => ({ ...prev, audio_url: audioUrl || '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.patient_name || !formData.auxiliary_name || !formData.date) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const reportData = {
        ...formData,
        professional_id: user.id,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        appointment_id: formData.appointment_id || null,
      };

      if (reportId) {
        // Mise à jour
        const { error } = await supabase
          .from('intervention_reports')
          .update(reportData)
          .eq('id', reportId);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Rapport mis à jour avec succès',
        });
      } else {
        // Création
        const { data: newReport, error } = await supabase
          .from('intervention_reports')
          .insert([reportData])
          .select()
          .single();

        if (error) throw error;

        // Si un rendez-vous est sélectionné, associer le rapport
        if (formData.appointment_id && newReport) {
          await supabase
            .from('appointments')
            .update({ 
              intervention_report_id: newReport.id,
              status: 'completed'
            })
            .eq('id', formData.appointment_id);
        }

        toast({
          title: 'Succès',
          description: 'Rapport créé avec succès',
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

  if (loadingData) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {reportId ? 'Modifier le rapport d\'intervention' : 'Nouveau rapport d\'intervention'}
          </CardTitle>
          <Button variant="outline" onClick={() => navigate('/scheduler')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rendez-vous associé */}
          <div>
            <Label htmlFor="appointment">Rendez-vous associé</Label>
            {selectedAppointment ? (
              <div className="p-3 bg-gray-50 rounded-md border">
                <div className="text-sm font-medium">
                  {selectedAppointment.client?.first_name} {selectedAppointment.client?.last_name} - {' '}
                  {new Date(selectedAppointment.start_time).toLocaleDateString()} {' '}
                  {new Date(selectedAppointment.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {selectedAppointment.intervenant && ` (${selectedAppointment.intervenant.first_name} ${selectedAppointment.intervenant.last_name})`}
                </div>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-xs"
                  onClick={() => setShowAppointmentSelector(true)}
                >
                  Changer le rendez-vous associé
                </Button>
              </div>
            ) : showAppointmentSelector && appointments.length > 0 ? (
              <div className="space-y-2">
                <Select onValueChange={handleAppointmentChange} value={formData.appointment_id || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un rendez-vous" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun rendez-vous</SelectItem>
                    {appointments.map((appointment) => (
                      <SelectItem key={appointment.id} value={appointment.id}>
                        {appointment.client?.first_name} {appointment.client?.last_name} - {' '}
                        {new Date(appointment.start_time).toLocaleDateString()} {' '}
                        {new Date(appointment.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {appointment.intervenant && ` (${appointment.intervenant.first_name} ${appointment.intervenant.last_name})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAppointmentSelector(false)}
                >
                  Annuler la sélection
                </Button>
              </div>
            ) : (
              <div className="p-3 bg-gray-50 rounded-md border">
                <div className="text-sm text-gray-500">
                  Aucun rendez-vous associé
                </div>
                {appointments.length > 0 && (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="p-0 h-auto text-xs"
                    onClick={() => setShowAppointmentSelector(true)}
                  >
                    Associer un rendez-vous
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Informations de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="patient_name">Nom du patient *</Label>
              <Input
                id="patient_name"
                value={formData.patient_name}
                onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="auxiliary_name">Nom de l'auxiliaire *</Label>
              <Input
                id="auxiliary_name"
                value={formData.auxiliary_name}
                onChange={(e) => setFormData({ ...formData, auxiliary_name: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Date et heure */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                type="date"
                id="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Heure</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="start_time">Début</Label>
                  <Input
                    type="time"
                    id="start_time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">Fin</Label>
                  <Input
                    type="time"
                    id="end_time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Activités */}
          <div>
            <Label>Activités réalisées</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {activitiesOptions.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`activity-${option.value}`}
                    checked={(formData.activities as string[]).includes(option.value)}
                    onCheckedChange={(checked) => handleCheckboxChange('activities', option.value)}
                  />
                  <Label htmlFor={`activity-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </div>
            <Textarea
              placeholder="Autres activités..."
              value={formData.activities_other}
              onChange={(e) => setFormData({ ...formData, activities_other: e.target.value })}
            />
          </div>

          {/* État physique */}
          <div>
            <Label>État physique</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {physicalStateOptions.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`physical-${option.value}`}
                    checked={(formData.physical_state as string[]).includes(option.value)}
                    onCheckedChange={(checked) => handleCheckboxChange('physical_state', option.value)}
                  />
                  <Label htmlFor={`physical-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </div>
            <Textarea
              placeholder="Autres détails sur l'état physique..."
              value={formData.physical_state_other}
              onChange={(e) => setFormData({ ...formData, physical_state_other: e.target.value })}
            />
          </div>

          {/* Douleur */}
          <div>
            <Label htmlFor="pain_location">Localisation de la douleur</Label>
            <Input
              id="pain_location"
              value={formData.pain_location}
              onChange={(e) => setFormData({ ...formData, pain_location: e.target.value })}
              placeholder="Si applicable, où se situe la douleur ?"
            />
          </div>

          {/* État mental */}
          <div>
            <Label>État mental</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {mentalStateOptions.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`mental-${option.value}`}
                    checked={(formData.mental_state as string[]).includes(option.value)}
                    onCheckedChange={(checked) => handleCheckboxChange('mental_state', option.value)}
                  />
                  <Label htmlFor={`mental-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </div>
            <Textarea
              placeholder="Changements d'humeur ou état mental particulier..."
              value={formData.mental_state_change}
              onChange={(e) => setFormData({ ...formData, mental_state_change: e.target.value })}
            />
          </div>

          {/* Hygiène */}
          <div>
            <Label>Hygiène</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {hygieneOptions.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`hygiene-${option.value}`}
                    checked={(formData.hygiene as string[]).includes(option.value)}
                    onCheckedChange={(checked) => handleCheckboxChange('hygiene', option.value)}
                  />
                  <Label htmlFor={`hygiene-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </div>
            <Textarea
              placeholder="Commentaires sur l'hygiène..."
              value={formData.hygiene_comments}
              onChange={(e) => setFormData({ ...formData, hygiene_comments: e.target.value })}
            />
          </div>

          {/* Appétit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="appetite">Appétit</Label>
              <Input
                id="appetite"
                value={formData.appetite}
                onChange={(e) => setFormData({ ...formData, appetite: e.target.value })}
                placeholder="Comment était l'appétit ?"
              />
            </div>
            <div>
              <Label htmlFor="appetite_comments">Commentaires sur l'appétit</Label>
              <Input
                id="appetite_comments"
                value={formData.appetite_comments}
                onChange={(e) => setFormData({ ...formData, appetite_comments: e.target.value })}
                placeholder="Des commentaires additionnels ?"
              />
            </div>
          </div>

          {/* Hydratation */}
          <div>
            <Label htmlFor="hydration">Hydratation</Label>
            <Input
              id="hydration"
              value={formData.hydration}
              onChange={(e) => setFormData({ ...formData, hydration: e.target.value })}
              placeholder="Comment s'est passée l'hydratation ?"
            />
          </div>

          {/* Observations */}
          <div>
            <Label htmlFor="observations">Observations générales</Label>
            <Textarea
              id="observations"
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              placeholder="Observations générales sur la journée..."
            />
          </div>

          {/* Suivi */}
          <div>
            <Label>Suivi nécessaire</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {followUpOptions.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`followup-${option.value}`}
                    checked={(formData.follow_up as string[]).includes(option.value)}
                    onCheckedChange={(checked) => handleCheckboxChange('follow_up', option.value)}
                  />
                  <Label htmlFor={`followup-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </div>
            <Textarea
              placeholder="Autres suivis à faire..."
              value={formData.follow_up_other}
              onChange={(e) => setFormData({ ...formData, follow_up_other: e.target.value })}
            />
          </div>

          {/* Taux horaire */}
          <div>
            <Label htmlFor="hourly_rate">Taux horaire</Label>
            <Input
              id="hourly_rate"
              type="number"
              step="0.01"
              value={formData.hourly_rate}
              onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
              placeholder="Taux horaire pour cette intervention"
            />
          </div>

          {/* Média */}
          <div>
            <Label>Médias</Label>
            <MediaUploader onMediaChange={handleMediaUpload} />
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.media_files.map((file, index) => (
                <Badge key={index} variant="secondary">
                  {file.name}
                  <Button variant="ghost" size="icon" onClick={() => handleMediaRemove(file)}>
                    <X className="h-4 w-4" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Enregistrement audio */}
          <div>
            <Label>Enregistrement audio</Label>
            <SimpleInterventionAudioRecorder onAudioChange={handleAudioUpload} />
            {formData.audio_url && (
              <audio controls src={formData.audio_url} className="mt-2">
                Your browser does not support the audio element.
              </audio>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => navigate('/scheduler')} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Sauvegarde...' : reportId ? 'Mettre à jour' : 'Sauvegarder'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default InterventionReportForm;
