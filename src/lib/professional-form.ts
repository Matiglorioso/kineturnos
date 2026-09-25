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
    errors.days = "Seleccioná al menos un día de atención";
  }

  const emailError = emailValidationError(values.email);
  if (emailError) errors.email = emailError;

  return errors;
}
