import { isEndTimeAfterStart } from "@/lib/professional-schedule";
import {
  DUPLICATE_LICENSE_MESSAGE,
  isDuplicateLicense,
  licenseFormatValidationError,
} from "@/lib/document-validation";
import { emailValidationError, requiredFieldError } from "@/lib/validation";
import type { Professional, WeekDay } from "@/types";

export interface ProfessionalFormValues {
  firstName: string;
  lastName: string;
  license: string;
  email: string;
  phone: string;
  specialty: string;
  days: WeekDay[];
  scheduleStart: string;
  scheduleEnd: string;
  defaultDuration: string;
  active: boolean;
  notes: string;
}

export type ProfessionalFormErrors = Partial<
  Record<keyof ProfessionalFormValues | "days", string>
>;

export interface ProfessionalFormValidationOptions {
  excludeProfessionalId?: string;
  existingProfessionals?: Array<Pick<Professional, "id" | "license">>;
}

export const INITIAL_PROFESSIONAL_FORM: ProfessionalFormValues = {
  firstName: "",
  lastName: "",
  license: "",
  email: "",
  phone: "",
  specialty: "",
  days: [],
  scheduleStart: "",
  scheduleEnd: "",
  defaultDuration: "45",
  active: true,
  notes: "",
};

export function buildProfessionalFormValues(
  professional: Professional
): ProfessionalFormValues {
  return {
    firstName: professional.firstName,
    lastName: professional.lastName,
    license: professional.license ?? "",
    email: professional.email ?? "",
    phone: professional.phone ?? "",
    specialty: professional.specialty,
    days: [...professional.days],
    scheduleStart: professional.scheduleStart.slice(0, 5),
    scheduleEnd: professional.scheduleEnd.slice(0, 5),
    defaultDuration: String(professional.defaultDuration),
    active: professional.active,
    notes: professional.notes ?? "",
  };
}

export function validateProfessionalForm(
  values: ProfessionalFormValues,
  options?: ProfessionalFormValidationOptions
): ProfessionalFormErrors {
  const errors: ProfessionalFormErrors = {};

  const firstNameError = requiredFieldError(
    values.firstName,
    "El nombre es obligatorio"
  );
  if (firstNameError) errors.firstName = firstNameError;

  const lastNameError = requiredFieldError(
    values.lastName,
    "El apellido es obligatorio"
  );
  if (lastNameError) errors.lastName = lastNameError;

  const licenseError = licenseFormatValidationError(values.license);
  if (licenseError) {
    errors.license = licenseError;
  } else if (
    options?.existingProfessionals &&
    isDuplicateLicense(
      values.license,
      options.existingProfessionals,
      options.excludeProfessionalId
    )
  ) {
    errors.license = DUPLICATE_LICENSE_MESSAGE;
  }

  if (!values.specialty) {
    errors.specialty = "La especialidad es obligatoria";
  }

  if (values.days.length === 0) {
    errors.days = "Selecciona al menos un dia de atencion";
  }

  if (!values.scheduleStart) {
    errors.scheduleStart = "La hora de inicio es obligatoria";
  }

  if (!values.scheduleEnd) {
    errors.scheduleEnd = "La hora de fin es obligatoria";
  }

  if (
    values.scheduleStart &&
    values.scheduleEnd &&
    !isEndTimeAfterStart(values.scheduleStart, values.scheduleEnd)
  ) {
    errors.scheduleEnd = "La hora de fin debe ser posterior a la de inicio";
  }

  if (!values.defaultDuration) {
    errors.defaultDuration = "La duracion es obligatoria";
  }

  const emailError = emailValidationError(values.email);
  if (emailError) errors.email = emailError;

  return errors;
}
