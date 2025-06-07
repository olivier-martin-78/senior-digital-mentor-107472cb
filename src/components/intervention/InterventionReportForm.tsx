
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import VoiceRecorder from '@/components/VoiceRecorder';
import MediaUploader from './MediaUploader';
import { AppointmentForIntervention } from '@/types/intervention';
import { format, parseISO } from 'date-fns';

interface FormData {
  appointmentId: string;
  date: string;
  startTime: string;
  endTime: string;
  auxiliaryName: string;
  patientName: string;
  physicalState: string[];
  physicalStateOther: string;
  painLocation: string;
  mentalState: string[];
  mentalStateChange: string;
  appetite: string;
  hydration: string;
  appetiteComments: string;
  hygiene: string[];
  hygieneComments: string;
  activities: string[];
  activitiesOther: string;
  observations: string;
  followUp: string[];
  followUpOther: string;
}

const InterventionReportForm = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentForIntervention[]>([]);
  const [formData, setFormData] = useState<FormData>({
    appointmentId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    auxiliaryName: '',
    patientName: '',
    physicalState: [],
    physicalStateOther: '',
    painLocation: '',
    mentalState: [],
    mentalStateChange: '',
    appetite: '',
    hydration: '',
    appetiteComments: '',
    hygiene: [],
    hygieneComments: '',
    activities: [],
    activitiesOther: '',
    observations: '',
    followUp: [],
    followUpOther: ''
  });

  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadAppointments();
    }
  }, [user, formData.date]);

  const loadAppointments = async () => {
    if (!user) return;

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
      .gte('start_time', `${formData.date}T00:00:00`)
      .lt('start_time', `${formData.date}T23:59:59`)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Erreur lors du chargement des rendez-vous:', error);
      return;
    }

    const transformedAppointments = (data || []).map(appointment => ({
      id: appointment.id,
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      status: appointment.status,
      client: appointment.clients
    }));

    setAppointments(transformedAppointments);
  };

  const handleAppointmentSelect = (appointmentId: string) => {
    const selectedAppointment = appointments.find(apt => apt.id === appointmentId);
    if (selectedAppointment) {
      const startTime = parseISO(selectedAppointment.start_time);
      const endTime = parseISO(selectedAppointment.end_time);
      
      setFormData(prev => ({
        ...prev,
        appointmentId,
        startTime: format(startTime, 'HH:mm'),
        endTime: format(endTime, 'HH:mm'),
        patientName: `${selectedAppointment.client.first_name} ${selectedAppointment.client.last_name}`
      }));
    }
  };

  const handleCheckboxChange = (field: keyof FormData, value: string) => {
    setFormData(prev => {
      const currentArray = prev[field] as string[];
      const newArray = currentArray.includes(value) 
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      return { ...prev, [field]: newArray };
    });
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const reportData = {
        appointment_id: formData.appointmentId || null,
        professional_id: user.id,
        date: formData.date,
        start_time: formData.startTime,
        end_time: formData.endTime,
        auxiliary_name: formData.auxiliaryName,
        patient_name: formData.patientName,
        physical_state: formData.physicalState,
        physical_state_other: formData.physicalStateOther,
        pain_location: formData.painLocation,
        mental_state: formData.mentalState,
        mental_state_change: formData.mentalStateChange,
        appetite: formData.appetite,
        hydration: formData.hydration,
        appetite_comments: formData.appetiteComments,
        hygiene: formData.hygiene,
        hygiene_comments: formData.hygieneComments,
        activities: formData.activities,
        activities_other: formData.activitiesOther,
        observations: formData.observations,
        follow_up: formData.followUp,
        follow_up_other: formData.followUpOther,
        media_files: mediaFiles
      };

      const { data: report, error } = await supabase
        .from('intervention_reports')
        .insert([reportData])
        .select()
        .single();

      if (error) throw error;

      // Mettre à jour le rendez-vous avec l'ID du rapport
      if (formData.appointmentId && report) {
        await supabase
          .from('appointments')
          .update({ intervention_report_id: report.id })
          .eq('id', formData.appointmentId);
      }

      toast({
        title: "Compte-rendu sauvegardé",
        description: "Le compte-rendu d'intervention a été enregistré avec succès",
      });

      // Réinitialiser le formulaire
      setFormData({
        appointmentId: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '',
        endTime: '',
        auxiliaryName: '',
        patientName: '',
        physicalState: [],
        physicalStateOther: '',
        painLocation: '',
        mentalState: [],
        mentalStateChange: '',
        appetite: '',
        hydration: '',
        appetiteComments: '',
        hygiene: [],
        hygieneComments: '',
        activities: [],
        activitiesOther: '',
        observations: '',
        followUp: [],
        followUpOther: ''
      });
      setMediaFiles([]);
      setAudioBlob(null);

    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le compte-rendu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-serif text-tranches-charcoal">
            📝 Compte-rendu d'intervention – Auxiliaire de vie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Informations générales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="date">Date de l'intervention</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="appointmentId">Rendez-vous associé (optionnel)</Label>
                <Select value={formData.appointmentId} onValueChange={handleAppointmentSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un rendez-vous planifié" />
                  </SelectTrigger>
                  <SelectContent>
                    {appointments.map(appointment => (
                      <SelectItem key={appointment.id} value={appointment.id}>
                        {format(parseISO(appointment.start_time), 'HH:mm')} - {appointment.client.first_name} {appointment.client.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="startTime">Heure de début</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endTime">Heure de fin</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="auxiliaryName">Nom de l'auxiliaire de vie</Label>
                <Input
                  id="auxiliaryName"
                  value={formData.auxiliaryName}
                  onChange={(e) => handleInputChange('auxiliaryName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="patientName">Nom de la personne accompagnée</Label>
                <Input
                  id="patientName"
                  value={formData.patientName}
                  onChange={(e) => handleInputChange('patientName', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* État général observé */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">👵 État général observé</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* État physique */}
                <div>
                  <Label className="text-base font-medium">État physique</Label>
                  <div className="mt-2 space-y-2">
                    {[
                      'En forme, aucun signe particulier',
                      'Fatigué(e) mais mobile',
                      'Faiblesses inhabituelles / Démarche instable',
                      'Douleurs exprimées'
                    ].map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`physical-${option}`}
                          checked={formData.physicalState.includes(option)}
                          onChange={() => handleCheckboxChange('physicalState', option)}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor={`physical-${option}`} className="text-sm">
                          {option}
                        </label>
                      </div>
                    ))}
                    {formData.physicalState.includes('Douleurs exprimées') && (
                      <Input
                        placeholder="Localisation des douleurs"
                        value={formData.painLocation}
                        onChange={(e) => handleInputChange('painLocation', e.target.value)}
                        className="mt-2"
                      />
                    )}
                    <Input
                      placeholder="Autre (précisez)"
                      value={formData.physicalStateOther}
                      onChange={(e) => handleInputChange('physicalStateOther', e.target.value)}
                    />
                  </div>
                </div>

                {/* État mental */}
                <div>
                  <Label className="text-base font-medium">État mental / émotionnel</Label>
                  <div className="mt-2 space-y-2">
                    {[
                      'Humeur stable et positive',
                      'Anxieux(se) ou agité(e)',
                      'Tristesse / Apathie / Isolement',
                      'Confusion / Perte de repères'
                    ].map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`mental-${option}`}
                          checked={formData.mentalState.includes(option)}
                          onChange={() => handleCheckboxChange('mentalState', option)}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor={`mental-${option}`} className="text-sm">
                          {option}
                        </label>
                      </div>
                    ))}
                    <Input
                      placeholder="Changement inhabituel d'attitude"
                      value={formData.mentalStateChange}
                      onChange={(e) => handleInputChange('mentalStateChange', e.target.value)}
                    />
                  </div>
                </div>

                {/* Appétit et hydratation */}
                <div>
                  <Label className="text-base font-medium">Appétit et hydratation</Label>
                  <div className="mt-2 space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Appétit</Label>
                      <div className="space-y-1">
                        {['Bon appétit, alimentation normale', 'Faible appétit', 'Refus de s\'alimenter'].map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id={`appetite-${option}`}
                              name="appetite"
                              value={option}
                              checked={formData.appetite === option}
                              onChange={() => handleInputChange('appetite', option)}
                              className="rounded border-gray-300"
                            />
                            <label htmlFor={`appetite-${option}`} className="text-sm">
                              {option}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Hydratation</Label>
                      <div className="space-y-1">
                        {['A bien bu', 'A peu bu', 'Refus d\'hydratation'].map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id={`hydration-${option}`}
                              name="hydration"
                              value={option}
                              checked={formData.hydration === option}
                              onChange={() => handleInputChange('hydration', option)}
                              className="rounded border-gray-300"
                            />
                            <label htmlFor={`hydration-${option}`} className="text-sm">
                              {option}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="appetiteComments">Commentaires</Label>
                      <Textarea
                        id="appetiteComments"
                        value={formData.appetiteComments}
                        onChange={(e) => handleInputChange('appetiteComments', e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                {/* Hygiène et autonomie */}
                <div>
                  <Label className="text-base font-medium">Hygiène et autonomie</Label>
                  <div className="mt-2 space-y-2">
                    {[
                      'A réalisé sa toilette seul(e)',
                      'Assistance partielle nécessaire',
                      'Assistance complète requise',
                      'A refusé les soins d\'hygiène'
                    ].map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`hygiene-${option}`}
                          checked={formData.hygiene.includes(option)}
                          onChange={() => handleCheckboxChange('hygiene', option)}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor={`hygiene-${option}`} className="text-sm">
                          {option}
                        </label>
                      </div>
                    ))}
                    <div>
                      <Label htmlFor="hygieneComments">Commentaires</Label>
                      <Textarea
                        id="hygieneComments"
                        value={formData.hygieneComments}
                        onChange={(e) => handleInputChange('hygieneComments', e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activités réalisées */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🏠 Activités réalisées durant l'intervention</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    'Aide au lever / coucher',
                    'Toilette / Soins d\'hygiène',
                    'Préparation et/ou prise des repas',
                    'Aide à la mobilité / promenade',
                    'Prise de médicaments (sous contrôle)',
                    'Entretien léger du domicile',
                    'Discussion / écoute / stimulation cognitive'
                  ].map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`activity-${option}`}
                        checked={formData.activities.includes(option)}
                        onChange={() => handleCheckboxChange('activities', option)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor={`activity-${option}`} className="text-sm">
                        {option}
                      </label>
                    </div>
                  ))}
                  <Input
                    placeholder="Autre (précisez)"
                    value={formData.activitiesOther}
                    onChange={(e) => handleInputChange('activitiesOther', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Observations particulières */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🔍 Observations particulières ou points d'alerte</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Changements observés, comportements inhabituels, éléments à surveiller..."
                  value={formData.observations}
                  onChange={(e) => handleInputChange('observations', e.target.value)}
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Enregistrement vocal */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🎤 Enregistrement vocal (optionnel)</CardTitle>
              </CardHeader>
              <CardContent>
                <VoiceRecorder onAudioChange={setAudioBlob} />
              </CardContent>
            </Card>

            {/* Upload de médias */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📷 Photos et documents (optionnel)</CardTitle>
              </CardHeader>
              <CardContent>
                <MediaUploader onMediaChange={setMediaFiles} />
              </CardContent>
            </Card>

            {/* Suivi / Recommandations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">✅ Suivi / Recommandations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    'Rien à signaler',
                    'Contacter le médecin traitant',
                    'Recommander une visite / appel du proche aidant'
                  ].map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`followup-${option}`}
                        checked={formData.followUp.includes(option)}
                        onChange={() => handleCheckboxChange('followUp', option)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor={`followup-${option}`} className="text-sm">
                        {option}
                      </label>
                    </div>
                  ))}
                  <Input
                    placeholder="Autre (précisez)"
                    value={formData.followUpOther}
                    onChange={(e) => handleInputChange('followUpOther', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Boutons d'action */}
            <div className="flex gap-4 pt-6">
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-tranches-sage hover:bg-tranches-sage/90"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Enregistrement...' : 'Enregistrer le compte-rendu'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InterventionReportForm;
