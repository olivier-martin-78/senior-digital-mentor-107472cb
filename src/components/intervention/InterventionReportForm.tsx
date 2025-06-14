
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
  const reportId = searchParams.get('reportId');
  const appointmentId = searchParams.get('appointmentId');

  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [allIntervenants, setAllIntervenants] = useState<Intervenant[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

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
      console.log('🔍 INTERVENTION_FORM - Début du chargement des données');
      console.log('🔍 INTERVENTION_FORM - reportId:', reportId);
      console.log('🔍 INTERVENTION_FORM - appointmentId:', appointmentId);
      
      // SIMPLIFICATION: Charger TOUS les clients créés par le professionnel
      // Plus de système de permissions pour l'instant
      const { data: allClients, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('created_by', user.id);

      if (clientError) {
        console.error('🔍 INTERVENTION_FORM - Erreur clients:', clientError);
      }

      const authorizedClients: Client[] = allClients || [];
      console.log('🔍 INTERVENTION_FORM - Clients chargés:', authorizedClients.length);
      setClients(authorizedClients);

      // Charger les rendez-vous (filtrés automatiquement par les clients autorisés)
      const loadedAppointments = await loadAppointments(authorizedClients);
      
      // Charger les intervenants autorisés
      await loadIntervenants();

      // Si on édite un rapport existant, le charger APRÈS avoir chargé les rendez-vous
      if (reportId) {
        console.log('🔍 INTERVENTION_FORM - Chargement du rapport existant...');
        await loadExistingReport(loadedAppointments);
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

  const loadAppointments = async (authorizedClients: Client[]) => {
    if (!user) {
      console.log('🔍 INTERVENTION_FORM - Pas d\'utilisateur');
      setAppointments([]);
      return [];
    }

    console.log('🔍 INTERVENTION_FORM - Chargement des rendez-vous...');
    
    // 1. Charger les rendez-vous pour les clients créés par l'utilisateur
    let allAppointments: any[] = [];
    
    if (authorizedClients.length > 0) {
      const clientIds = authorizedClients.map(c => c.id);
      console.log('🔍 INTERVENTION_FORM - IDs des clients autorisés:', clientIds);
      
      const { data: clientAppointments, error: clientAppointmentError } = await supabase
        .from('appointments')
        .select(`
          *,
          clients:client_id (
            id, first_name, last_name, address, phone, email, color, hourly_rate, created_at, updated_at, created_by
          ),
          intervenants:intervenant_id (
            id, first_name, last_name, email, phone, speciality, active, created_at, updated_at, created_by
          )
        `)
        .in('client_id', clientIds);

      if (clientAppointmentError) {
        console.error('🔍 INTERVENTION_FORM - Erreur rendez-vous clients:', clientAppointmentError);
      } else {
        allAppointments.push(...(clientAppointments || []));
        console.log('🔍 INTERVENTION_FORM - Rendez-vous clients chargés:', clientAppointments?.length || 0);
      }
    }

    // 2. NOUVEAU: Charger AUSSI les rendez-vous où l'utilisateur est assigné comme intervenant
    console.log('🔍 INTERVENTION_FORM - Chargement des rendez-vous comme intervenant...');
    
    // D'abord trouver les intervenants correspondant à l'email de l'utilisateur
    const { data: userIntervenants, error: intervenantError } = await supabase
      .from('intervenants')
      .select('id')
      .eq('email', user.email);

    if (intervenantError) {
      console.error('🔍 INTERVENTION_FORM - Erreur intervenants utilisateur:', intervenantError);
    } else if (userIntervenants && userIntervenants.length > 0) {
      const intervenantIds = userIntervenants.map(i => i.id);
      console.log('🔍 INTERVENTION_FORM - IDs intervenants utilisateur:', intervenantIds);

      // Charger les rendez-vous où l'utilisateur est intervenant
      const { data: intervenantAppointments, error: intervenantAppointmentError } = await supabase
        .from('appointments')
        .select(`
          *,
          clients:client_id (
            id, first_name, last_name, address, phone, email, color, hourly_rate, created_at, updated_at, created_by
          ),
          intervenants:intervenant_id (
            id, first_name, last_name, email, phone, speciality, active, created_at, updated_at, created_by
          )
        `)
        .in('intervenant_id', intervenantIds);

      if (intervenantAppointmentError) {
        console.error('🔍 INTERVENTION_FORM - Erreur rendez-vous intervenant:', intervenantAppointmentError);
      } else {
        console.log('🔍 INTERVENTION_FORM - Rendez-vous intervenant chargés:', intervenantAppointments?.length || 0);
        
        // Filtrer les doublons et ajouter uniquement les nouveaux rendez-vous
        const newAppointments = (intervenantAppointments || []).filter(
          apt => !allAppointments.some(existing => existing.id === apt.id)
        );
        allAppointments.push(...newAppointments);
        console.log('🔍 INTERVENTION_FORM - Nouveaux rendez-vous intervenant ajoutés:', newAppointments.length);
      }
    }

    // Transformer les données
    const transformedAppointments = allAppointments.map(item => ({
      ...item,
      status: item.status as 'scheduled' | 'completed' | 'cancelled',
      recurrence_type: item.recurrence_type as 'weekly' | 'monthly' | undefined,
      client: item.clients,
      intervenant: item.intervenants,
      caregivers: []
    }));

    console.log('🔍 INTERVENTION_FORM - Total rendez-vous transformés:', transformedAppointments.length);
    console.log('🔍 INTERVENTION_FORM - IDs des rendez-vous:', transformedAppointments.map(apt => apt.id));
    setAppointments(transformedAppointments);

    // Après avoir chargé les rendez-vous, vérifier si on doit sélectionner un rendez-vous spécifique
    if (appointmentId && transformedAppointments.length > 0) {
      console.log('🔍 INTERVENTION_FORM - Recherche du rendez-vous par URL:', appointmentId);
      const appointment = transformedAppointments.find(apt => apt.id === appointmentId);
      if (appointment) {
        console.log('🔍 INTERVENTION_FORM - Rendez-vous trouvé par URL:', appointment);
        handleAppointmentChange(appointmentId, transformedAppointments);
      } else {
        console.log('🔍 INTERVENTION_FORM - Rendez-vous non trouvé par URL');
      }
    }

    return transformedAppointments;
  };

  const loadIntervenants = async () => {
    if (!user) return;

    console.log('🔍 INTERVENTION_FORM - Chargement des intervenants...');
    
    // SIMPLIFICATION: Charger TOUS les intervenants créés par le professionnel
    const { data: allIntervenantsData, error: intervenantError } = await supabase
      .from('intervenants')
      .select('*')
      .eq('created_by', user.id);

    if (intervenantError) {
      console.error('🔍 INTERVENTION_FORM - Erreur intervenants:', intervenantError);
      return;
    }

    console.log('🔍 INTERVENTION_FORM - Intervenants chargés:', allIntervenantsData?.length || 0);
    setAllIntervenants(allIntervenantsData || []);
  };

  const loadExistingReport = async (appointmentsList: Appointment[]) => {
    if (!reportId || !user) return;

    console.log('🔍 INTERVENTION_FORM - Chargement du rapport ID:', reportId);

    const { data: report, error } = await supabase
      .from('intervention_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error) {
      console.error('🔍 INTERVENTION_FORM - Erreur lors du chargement du rapport:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger le rapport',
        variant: 'destructive',
      });
      return;
    }

    if (report) {
      console.log('🔍 INTERVENTION_FORM - Rapport chargé:', report);
      console.log('🔍 INTERVENTION_FORM - appointment_id du rapport:', report.appointment_id);
      
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
        console.log('🔍 INTERVENTION_FORM - Recherche du rendez-vous associé:', report.appointment_id);
        console.log('🔍 INTERVENTION_FORM - Liste des rendez-vous disponibles:', appointmentsList.map(apt => apt.id));
        const foundAppointment = appointmentsList.find(apt => apt.id === report.appointment_id);
        if (foundAppointment) {
          console.log('🔍 INTERVENTION_FORM - Rendez-vous associé trouvé:', foundAppointment);
          setSelectedAppointment(foundAppointment);
        } else {
          console.log('🔍 INTERVENTION_FORM - Rendez-vous associé non trouvé dans la liste');
          // Si le rendez-vous n'est pas trouvé dans la liste, essayer de le charger directement
          console.log('🔍 INTERVENTION_FORM - Tentative de chargement direct du rendez-vous...');
          const { data: directAppointment, error: directError } = await supabase
            .from('appointments')
            .select(`
              *,
              clients:client_id (
                id, first_name, last_name, address, phone, email, color, hourly_rate, created_at, updated_at, created_by
              ),
              intervenants:intervenant_id (
                id, first_name, last_name, email, phone, speciality, active, created_at, updated_at, created_by
              )
            `)
            .eq('id', report.appointment_id)
            .single();

          if (!directError && directAppointment) {
            console.log('🔍 INTERVENTION_FORM - Rendez-vous chargé directement:', directAppointment);
            const transformedDirectAppointment = {
              ...directAppointment,
              status: directAppointment.status as 'scheduled' | 'completed' | 'cancelled',
              recurrence_type: directAppointment.recurrence_type as 'weekly' | 'monthly' | undefined,
              client: directAppointment.clients,
              intervenant: directAppointment.intervenants,
              caregivers: []
            };
            setSelectedAppointment(transformedDirectAppointment);
          }
        }
      } else {
        console.log('🔍 INTERVENTION_FORM - Pas d\'appointment_id ou liste vide');
      }
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
      console.log('🔍 INTERVENTION_FORM - Rendez-vous sélectionné:', appointment);
      setSelectedAppointment(appointment);
      
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
      console.log('🔍 INTERVENTION_FORM - Rendez-vous non trouvé pour ID:', appointmentId);
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
          {/* Rendez-vous associé - NON MODIFIABLE */}
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
                <div className="text-xs text-gray-500 mt-1">
                  Ce champ n'est pas modifiable
                </div>
              </div>
            ) : (
              <div className="p-3 bg-gray-50 rounded-md border">
                <div className="text-sm text-gray-500">
                  Aucun rendez-vous associé - Vérifiez les logs de la console pour plus de détails
                </div>
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
