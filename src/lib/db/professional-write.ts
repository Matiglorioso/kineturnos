import { buildProfessionalName } from "@/lib/professional-utils";
import { normalizeLicense } from "@/lib/document-validation";
import type { Professional, WeekDay } from "@/types";

export interface ProfessionalWriteInput {
  id?: string;
  firstName: string;
  lastName: string;
  license: string;
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
}

export function professionalToWriteInput(
  professional: Professional
): ProfessionalWriteInput {
  return {
    id: professional.id,
    firstName: professional.firstName,
    lastName: professional.lastName,
    license: professional.license ?? "",
    email: professional.email,
    phone: professional.phone,
    specialty: professional.specialty,
    days: professional.days,
    scheduleStart: professional.scheduleStart,
    scheduleEnd: professional.scheduleEnd,
    defaultDuration: professional.defaultDuration,
    active: professional.active,
    avatarColor: professional.avatarColor,
    notes: professional.notes,
  };
}

export function toProfesionalWriteData(input: ProfessionalWriteInput) {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const license = input.license.trim();

  return {
    nombre: buildProfessionalName(firstName, lastName),
    nombrePila: firstName,
    apellido: lastName,
    ...toProfesionalLicenseData(license),
    email: input.email?.trim() || null,
    telefono: input.phone?.trim() || null,
    especialidad: input.specialty,
    diasAtencion: input.days,
    horarioInicio: input.scheduleStart.slice(0, 5),
    horarioFin: input.scheduleEnd.slice(0, 5),
    duracionDefault: input.defaultDuration,
    activo: input.active,
    colorAvatar: input.avatarColor,
    observaciones: input.notes?.trim() || null,
  };
}

export function toProfesionalLicenseData(license?: string) {
  const matricula = license?.trim() || null;

  return {
    matricula,
    matriculaNormalizada: matricula ? normalizeLicense(matricula) : null,
  };
}

export function resolveProfessionalId(input: ProfessionalWriteInput): string {
  return input.id?.trim() || `prof-${Date.now()}`;
}
