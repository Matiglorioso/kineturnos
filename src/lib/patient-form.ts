import { Patient, PatientStatus } from "@/types";
import {
  dniFormatValidationError,
  DUPLICATE_DNI_MESSAGE,
  isDuplicateDni,
} from "@/lib/document-validation";
import { resolveNameParts } from "@/lib/person-name";
import { emailValidationError, requiredFieldError } from "@/lib/validation";

export interface PatientFormValues {
  firstName: string;
  lastName: string;
  dni: string;
  phone: string;
  email: string;
  insurance: string;
  status: PatientStatus;
  notes: string;
}

export type PatientFormErrors = Partial<Record<keyof PatientFormValues, string>>;

export interface PatientFormValidationOptions {
  excludePatientId?: string;
  existingPatients?: Array<Pick<Patient, "id" | "dni">>;
}

export const INITIAL_PATIENT_FORM: PatientFormValues = {
  firstName: "",
  lastName: "",
  dni: "",
  phone: "",
  email: "",
  insurance: "",
  status: "activo",
  notes: "",
};

export function buildPatientFormValues(patient: Patient): PatientFormValues {
  const { firstName, lastName } = resolveNameParts(
    patient.name,
    patient.firstName,
    patient.lastName
  );

  return {
    firstName,
    lastName,
    dni: patient.dni,
    phone: patient.phone,
    email: patient.email ?? "",
    insurance: patient.insurance === "Particular" ? "" : patient.insurance,
    status: patient.status,
    notes: patient.notes ?? "",
  };
}

export function validatePatientForm(
  values: PatientFormValues,
  options?: PatientFormValidationOptions
): PatientFormErrors {
  const errors: PatientFormErrors = {};

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

  const dniError = dniFormatValidationError(values.dni);
  if (dniError) {
    errors.dni = dniError;
  } else if (
    options?.existingPatients &&
    isDuplicateDni(values.dni, options.existingPatients, options.excludePatientId)
  ) {
    errors.dni = DUPLICATE_DNI_MESSAGE;
  }

  const phoneError = requiredFieldError(values.phone, "El telefono es obligatorio");
  if (phoneError) errors.phone = phoneError;

  const emailError = emailValidationError(values.email);
  if (emailError) errors.email = emailError;

  return errors;
}

/** @deprecated Usar PatientFormValues */
export type NewPatientFormValues = PatientFormValues;
