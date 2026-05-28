import { Patient, PatientStatus } from "@/types";
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
  const nameParts = patient.name.trim().split(/\s+/);
  const firstName = patient.firstName ?? nameParts[0] ?? "";
  const lastName =
    patient.lastName ?? (nameParts.length > 1 ? nameParts.slice(1).join(" ") : "");

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

export function validatePatientForm(values: PatientFormValues): PatientFormErrors {
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

  const dniError = requiredFieldError(values.dni, "El DNI es obligatorio");
  if (dniError) errors.dni = dniError;

  const phoneError = requiredFieldError(values.phone, "El telefono es obligatorio");
  if (phoneError) errors.phone = phoneError;

  const emailError = emailValidationError(values.email);
  if (emailError) errors.email = emailError;

  return errors;
}

/** @deprecated Usar PatientFormValues */
export type NewPatientFormValues = PatientFormValues;
