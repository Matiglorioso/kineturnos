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
  /** Nombre de la obra social, o "Particular". */
  insurance: string;
  /** Obra social del catálogo; null o ausente = Particular. */
  insuranceId?: string | null;
  affiliateNumber?: string;
  insurancePlan?: string;
  /** Estado de la autorización con la obra social actual (lo calcula el servidor). */
  coverage?: PatientCoverage;
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
  /** Hasta cuándo se puede corregir (ISO 8601), si `editable`. */
  editableUntil: string | null;
}

/** Alertas (alergias, contraindicaciones) y antecedentes del paciente. */
export interface ClinicalProfile {
  alerts: string | null;
  background: string | null;
  updatedByName: string;
  /** ISO 8601 */
  updatedAt: string;
}

/** Objetivo del plan de tratamiento. */
export interface TreatmentGoal {
  id: string;
  description: string;
  achieved: boolean;
  /** ISO 8601 */
  achievedAt: string | null;
  createdByName: string;
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
  patient: {
    id: string;
    name: string;
    dni: string;
    insurance: string;
    phone: string;
    coverage?: PatientCoverage;
  };
  entries: ClinicalEntry[];
  summary: ClinicalSummary;
  sessionOptions: ClinicalSessionOption[];
  profile: ClinicalProfile | null;
  goals: TreatmentGoal[];
  /** Próximo turno activo del paciente (para el encabezado). */
  nextAppointment: { date: string; time: string; professionalName: string } | null;
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

/** Obra social del catálogo. */
export interface Insurance {
  id: string;
  name: string;
  active: boolean;
  notes: string | null;
  /** Pacientes que la tienen como obra social actual. */
  patientCount: number;
}

export type AuthorizationState = "pendiente" | "aprobada" | "rechazada";

/** Autorización de la obra social para un tratamiento. */
export interface Authorization {
  id: string;
  patientId: string;
  insuranceId: string;
  insuranceName: string;
  number: string | null;
  state: AuthorizationState;
  sessions: number;
  /** Sesiones atendidas que consumió. */
  used: number;
  /** dd-MM-yyyy */
  validFrom: string;
  /** dd-MM-yyyy, o null si no vence. */
  validUntil: string | null;
  notes: string | null;
  createdByName: string;
  /** Es de la obra social actual del paciente. */
  current: boolean;
}

export type AuthorizationStatus =
  | "por-renovar"
  | "vigente"
  | "pendiente"
  | "agotada"
  | "vencida"
  | "rechazada";

/** Fila del listado general de autorizaciones (pestaña Autorizaciones). */
export interface AuthorizationListItem extends Authorization {
  patientName: string;
  patientDni: string;
  status: AuthorizationStatus;
}

/** Resumen de la cobertura para chips y avisos. */
export interface PatientCoverage {
  kind: "particular" | "sin-autorizacion" | "pendiente" | "vigente" | "agotada" | "vencida";
  tone: "none" | "ok" | "warning" | "alert";
  label: string;
}

/** Planilla de asistencia mensual de una obra social (facturación). */
export interface AttendanceReport {
  insurance: { id: string; name: string };
  /** yyyy-MM */
  month: string;
  rows: {
    patientId: string;
    patientName: string;
    dni: string;
    affiliateNumber: string | null;
    plan: string | null;
    authorizationNumbers: string[];
    /** dd-MM-yyyy, en orden. */
    dates: string[];
    /** Sesiones atendidas sin autorización que las cubra. */
    withoutAuthorization: number;
  }[];
  totalSessions: number;
}
