import { toast } from "sonner";

const DEFAULT_SUCCESS_MS = 4000;
const DEFAULT_ERROR_MS = 5000;

export function showSuccessToast(title: string, description?: string) {
  toast.success(title, {
    description,
    duration: DEFAULT_SUCCESS_MS,
  });
}

export function showErrorToast(title: string, description?: string) {
  toast.error(title, {
    description,
    duration: DEFAULT_ERROR_MS,
  });
}

export const appToasts = {
  patient: {
    created: (name: string) =>
      showSuccessToast(
        "Paciente registrado",
        `${name} ya forma parte del consultorio.`
      ),
    discharged: (name: string) =>
      showSuccessToast("Paciente dado de baja", `${name} quedó dado de baja. Sus registros se conservan.`),
    reactivated: (name: string) => showSuccessToast("Paciente reactivado", `${name} volvió a estar activo.`),
    updated: (name: string) =>
      showSuccessToast(
        "Datos actualizados",
        `La ficha de ${name} se guardó correctamente.`
      ),
    validationError: () =>
      showErrorToast(
        "Revisá el formulario",
        "Completá los campos obligatorios antes de continuar."
      ),
    saveError: (description?: string) =>
      showErrorToast(
        "No se pudo guardar",
        description ??
          "Revisá la conexión con la base de datos e intentá de nuevo."
      ),
  },
  appointment: {
    created: (patientName: string, dateLabel: string, time: string) =>
      showSuccessToast(
        "Turno agendado",
        `${patientName} — ${dateLabel} a las ${time} hs.`
      ),
    updated: (patientName: string) =>
      showSuccessToast(
        "Turno actualizado",
        `Los cambios del turno de ${patientName} se guardaron.`
      ),
    cancelled: (patientName: string) =>
      showSuccessToast(
        "Turno cancelado",
        `La sesión de ${patientName} quedó marcada como cancelada.`
      ),
    attended: (patientName: string) =>
      showSuccessToast(
        "Sesión atendida",
        `${patientName} fue marcado como atendido.`
      ),
    absent: (patientName: string) =>
      showSuccessToast(
        "Ausencia registrada",
        `El turno de ${patientName} quedó marcado como ausente.`
      ),
    deleted: (patientName: string) =>
      showSuccessToast(
        "Turno eliminado",
        `Se eliminó el turno de ${patientName}.`
      ),
    validationError: () =>
      showErrorToast(
        "Revisá el formulario",
        "Corregí los campos marcados o el conflicto de horario."
      ),
    saveError: (description?: string) =>
      showErrorToast(
        "No se pudo guardar",
        description ?? "Seleccioná un paciente y un profesional válidos."
      ),
    deleteError: (description?: string) =>
      showErrorToast(
        "No se pudo eliminar",
        description ?? "Intentá de nuevo o revisá el estado del turno."
      ),
  },
  professional: {
    created: (name: string) =>
      showSuccessToast(
        "Profesional registrado",
        `${name} ya está disponible en la agenda.`
      ),
    updated: (name: string) =>
      showSuccessToast(
        "Datos actualizados",
        `La ficha de ${name} se guardó correctamente.`
      ),
    deactivated: (name: string) =>
      showSuccessToast(
        "Profesional desactivado",
        `${name} no aparecerá al crear turnos nuevos.`
      ),
    validationError: () =>
      showErrorToast(
        "Revisá el formulario",
        "Completá los campos obligatorios antes de continuar."
      ),
    saveError: (description?: string) =>
      showErrorToast(
        "No se pudo guardar",
        description ??
          "Revisá la conexión con la base de datos e intentá de nuevo."
      ),
  },
} as const;
