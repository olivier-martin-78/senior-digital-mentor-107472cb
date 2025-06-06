
export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  address: string;
  phone?: string;
  email?: string;
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
  created_at: string;
  updated_at: string;
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
