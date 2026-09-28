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
  /** HH:mm; todos los turnos duran 1 hora */
  time: string;
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

/** Registro de la historia clínica: una sesión (RF11). */
export interface ClinicalEntry {
  id: string;
  patientId: string;
  professionalId: string | null;
  professionalName: string | null;
  /** Turno de la sesión, si se registró desde un turno. */
  appointmentId: string | null;
  authorName: string;
  /** Formato dd-MM-yyyy */
  date: string;
  diagnosis: string | null;
  treatment: string | null;
  evolution: string;
  /** ISO 8601 */
  createdAt: string;
  updatedAt: string;
  /** El usuario actual lo puede corregir (autor, dentro de las 24 h). */
  editable: boolean;
}

/** Diagnóstico y plan vigentes: los del último registro que los cargó. */
export interface ClinicalSummary {
  diagnosis: { text: string; date: string } | null;
  treatment: { text: string; date: string } | null;
}

/** Turno del paciente que puede asociarse a un registro nuevo. */
export interface ClinicalSessionOption {
  id: string;
  date: string;
  time: string;
  professionalName: string;
  status: AppointmentStatus;
}

export interface ClinicalHistory {
  patient: { id: string; name: string; dni: string; insurance: string };
  entries: ClinicalEntry[];
  summary: ClinicalSummary;
  sessionOptions: ClinicalSessionOption[];
}

export interface ClinicalAccessLogItem {
  id: string;
  userName: string;
  userRole: string;
  action: "lectura" | "alta" | "edicion";
  entryId: string | null;
  /** ISO 8601 */
  at: string;
}
