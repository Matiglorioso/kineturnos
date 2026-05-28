export type AppointmentStatus =
  | "pendiente"
  | "confirmado"
  | "atendido"
  | "cancelado"
  | "ausente";

export type SessionType =
  | "Evaluación inicial"
  | "Rehabilitación"
  | "Kinesiología respiratoria"
  | "RPG"
  | "Traumatología"
  | "Deportiva"
  | "Control";

export type PatientStatus = "activo" | "inactivo";

export type ProfessionalSpecialty =
  | "Traumatología"
  | "Deportiva"
  | "Respiratoria"
  | "RPG"
  | "Neurológica"
  | "Rehabilitación general";

export type WeekDay =
  | "Lunes"
  | "Martes"
  | "Miércoles"
  | "Jueves"
  | "Viernes"
  | "Sábado";

export interface Patient {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  dni: string;
  phone: string;
  insurance: string;
  /** Formato dd-MM-yyyy */
  lastAppointment?: string;
  status: PatientStatus;
  email?: string;
  notes?: string;
  /** Formato dd-MM-yyyy */
  createdAt?: string;
}

export interface Professional {
  id: string;
  /** Nombre completo para listados y turnos */
  name: string;
  firstName: string;
  lastName: string;
  license?: string;
  email?: string;
  phone?: string;
  specialty: string;
  days: WeekDay[];
  scheduleStart: string;
  scheduleEnd: string;
  defaultDuration: number;
  active: boolean;
  avatarColor: string;
  notes?: string;
  /** @deprecated Solo migración desde datos antiguos */
  schedule?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  professionalId: string;
  professionalName: string;
  /** Formato dd-MM-yyyy */
  date: string;
  time: string;
  duration: number;
  status: AppointmentStatus;
  sessionType: SessionType;
  notes?: string;
}

export interface ActivityItem {
  id: string;
  type: "appointment" | "patient" | "cancellation" | "confirmation";
  message: string;
  timestamp: string;
  icon?: string;
}

export interface StatMetric {
  label: string;
  value: number;
  change?: string;
  trend?: "up" | "down" | "neutral";
}
