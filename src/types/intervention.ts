
export interface InterventionReport {
  id: string;
  appointment_id?: string;
  professional_id: string;
  date: string;
  start_time: string;
  end_time: string;
  auxiliary_name: string;
  patient_name: string;
  physical_state: string[];
  physical_state_other?: string;
  pain_location?: string;
  mental_state: string[];
  mental_state_change?: string;
  appetite: string;
  hydration: string;
  appetite_comments?: string;
  hygiene: string[];
  hygiene_comments?: string;
  activities: string[];
  activities_other?: string;
  observations?: string;
  follow_up: string[];
  follow_up_other?: string;
  audio_url?: string;
  media_files?: any[];
  client_rating?: number;
  client_comments?: string;
  hourly_rate?: number;
  created_at: string;
  updated_at: string;
}

export interface AppointmentForIntervention {
  id: string;
  start_time: string;
  end_time: string;
  client: {
    first_name: string;
    last_name: string;
  };
  status: string;
}
