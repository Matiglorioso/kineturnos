/**
 * @deprecated Importar desde `@/lib/time-utils`, `@/lib/appointment-validation` o `@/lib/date-utils`.
 * Re-exporta APIs historicas para compatibilidad.
 */
export {
  getEndTime,
  minutesToTime,
  normalizeTime,
  timeToMinutes,
} from "@/lib/time-utils";

export {
  hasProfessionalOverlap,
  validateAppointmentForm,
  type AppointmentFormErrors,
  type AppointmentFormInput,
} from "@/lib/appointment-validation";

export { isPastAppDate as isPastDate } from "@/lib/date-utils";
