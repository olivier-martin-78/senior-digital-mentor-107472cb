
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { FileText, Save, ArrowLeft, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MediaUploader } from './MediaUploader';
import SimpleInterventionAudioRecorder from './SimpleInterventionAudioRecorder';
import { AppointmentSelector } from './components/AppointmentSelector';
import { ClientEvaluation } from './components/ClientEvaluation';
import { useInterventionForm } from './hooks/useInterventionForm';

const InterventionReportForm = () => {
  const navigate = useNavigate();
  const {
    formData,
    setFormData,
    selectedAppointment,
    setSelectedAppointment,
    loading,
    loadingData,
    showAppointmentSelector,
    setShowAppointmentSelector,
    appointments,
    reportId,
    handleAppointmentChange,
    handleSubmit,
  } = useInterventionForm();

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
          <AppointmentSelector
            selectedAppointment={selectedAppointment}
            showAppointmentSelector={showAppointmentSelector}
            appointments={appointments}
            onAppointmentChange={handleAppointmentChange}
            onShowSelector={() => setShowAppointmentSelector(true)}
            onHideSelector={() => setShowAppointmentSelector(false)}
            appointmentId={formData.appointment_id}
          />

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
                    checked={formData.activities.includes(option.value)}
                    onCheckedChange={() => handleCheckboxChange('activities', option.value)}
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
                    checked={formData.physical_state.includes(option.value)}
                    onCheckedChange={() => handleCheckboxChange('physical_state', option.value)}
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
                    checked={formData.mental_state.includes(option.value)}
                    onCheckedChange={() => handleCheckboxChange('mental_state', option.value)}
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
                    checked={formData.hygiene.includes(option.value)}
                    onCheckedChange={() => handleCheckboxChange('hygiene', option.value)}
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
              <Select value={formData.appetite} onValueChange={(value) => setFormData({ ...formData, appetite: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner l'état de l'appétit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bon">Bon</SelectItem>
                  <SelectItem value="Moyen">Moyen</SelectItem>
                  <SelectItem value="N'a pas mangé">N'a pas mangé</SelectItem>
                </SelectContent>
              </Select>
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
            <Select value={formData.hydration} onValueChange={(value) => setFormData({ ...formData, hydration: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner l'état d'hydratation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Satisfaisante">Satisfaisante</SelectItem>
                <SelectItem value="Insuffisante">Insuffisante</SelectItem>
                <SelectItem value="Non observée">Non observée</SelectItem>
              </SelectContent>
            </Select>
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
                    checked={formData.follow_up.includes(option.value)}
                    onCheckedChange={() => handleCheckboxChange('follow_up', option.value)}
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

          <ClientEvaluation
            clientRating={formData.client_rating}
            clientComments={formData.client_comments}
            onRatingChange={(rating) => setFormData(prev => ({ ...prev, client_rating: rating }))}
            onCommentsChange={(comments) => setFormData(prev => ({ ...prev, client_comments: comments }))}
          />

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
