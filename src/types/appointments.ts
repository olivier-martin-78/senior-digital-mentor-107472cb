
export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  address: string;
  phone?: string;
  email?: string;
  color?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface Caregiver {
  id: string;
  client_id: string;
  first_name: string;
  last_name: string;
  address?: string;
  phone?: string;
  email?: string;
  relationship_type: string;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  client_id: string;
  professional_id: string;
  start_time: string;
  end_time: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  email_sent: boolean;
  intervention_report_id?: string;
  created_at: string;
  updated_at: string;
  is_recurring: boolean;
  recurrence_type?: 'weekly' | 'monthly';
  recurrence_end_date?: string;
  parent_appointment_id?: string;
  client?: Client;
  caregivers?: Caregiver[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: Appointment;
}
