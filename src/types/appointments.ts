
export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  address: string;
  postal_code?: string;
  city?: string;
  phone?: string;
  email?: string;
  color?: string;
  hourly_rate?: number;
  comment?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface Caregiver {
  id: string;
  first_name: string;
  last_name: string;
  relationship_type: string;
  phone?: string;
  email?: string;
  address?: string;
  client_id: string;
  created_at: string;
  updated_at: string;
}

export interface Intervenant {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  speciality?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface Appointment {
  id: string;
  client_id: string;
  client?: Client;
  intervenant_id?: string;
  intervenant?: Intervenant;
  professional_id: string;
  updated_by_professional_id?: string; // NOUVEAU : ID de celui qui a modifié en dernier
  start_time: string;
  end_time: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  email_sent?: boolean;
  created_at: string;
  updated_at: string;
  intervention_report_id?: string;
  is_recurring?: boolean;
  recurrence_type?: 'weekly' | 'monthly';
  recurrence_end_date?: string;
  parent_appointment_id?: string;
  caregivers: Caregiver[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: Appointment;
}
