
export interface InterventionNotificationRequest {
  reportId: string;
  title: string;
}

export interface ReportData {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  patient_name: string;
  auxiliary_name: string;
  hourly_rate: number;
  activities: string[];
  activities_other?: string;
  physical_state: string[];
  physical_state_other?: string;
  pain_location?: string;
  mental_state: string[];
  mental_state_change?: string;
  hygiene: string[];
  hygiene_comments?: string;
  appetite: string;
  appetite_comments?: string;
  hydration: string;
  follow_up: string[];
  follow_up_other?: string;
  observations?: string;
  client_rating?: number;
  client_comments?: string;
  appointments?: {
    clients?: {
      id: string;
      first_name: string;
      last_name: string;
    };
  };
}

export interface CaregiverData {
  first_name: string;
  last_name: string;
  email: string;
  relationship_type: string;
}
