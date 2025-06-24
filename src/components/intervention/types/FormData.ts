
export interface InterventionFormData {
  appointment_id: string;
  patient_name: string;
  auxiliary_name: string;
  date: string;
  start_time: string;
  end_time: string;
  activities: string[];
  activities_other: string;
  physical_state: string[];
  physical_state_other: string;
  pain_location: string;
  mental_state: string[];
  mental_state_change: string;
  hygiene: string[];
  hygiene_comments: string;
  appetite: string;
  appetite_comments: string;
  hydration: string;
  observations: string;
  follow_up: string[];
  follow_up_other: string;
  hourly_rate: string;
  media_files: any[];
  audio_url: string;
  client_rating: number;
  client_comments: string;
}
