import { Patient, PatientStatus } from "@/types";
import { birthDateValidationError, normalizeBirthDateInput } from "@/lib/birth-date";
import {
  cuilFormatValidationError,
  dniFormatValidationError,
  formatCuil,
  normalizeCuil,
  DUPLICATE_DNI_MESSAGE,
  isDuplicateDni,
} from "@/lib/document-validation";
import { resolveNameParts } from "@/lib/person-name";
import { emailValidationError, requiredFieldError } from "@/lib/validation";

export interface PatientFormValues {
  firstName: string;
  lastName: string;
  dni: string;
  cuil: string;
  /** dd-mm-aaaa, tal como se escribe. */
  birthDate: string;
  phone: string;
  email: string;
  insurance: string;
  /** Obra social del catálogo; "" = Particular. */
  insuranceId: string;
  affiliateNumber: string;
  insurancePlan: string;
  status: PatientStatus;
  notes: string;
}

export type PatientFormErrors = Partial<Record<keyof PatientFormValues, string>>;

export interface PatientFormValidationOptions {
  excludePatientId?: string;
  existingPatients?: Array<Pick<Patient, "id" | "dni">>;
  /** dd-MM-yyyy; por defecto, hoy en el consultorio. */
  today?: string;
}

export const INITIAL_PATIENT_FORM: PatientFormValues = {
  firstName: "",
  lastName: "",
  dni: "",
  cuil: "",
  birthDate: "",
  phone: "",
  email: "",
  insurance: "",
  insuranceId: "",
  affiliateNumber: "",
  insurancePlan: "",
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
    cuil: patient.cuil ? formatCuil(patient.cuil) : "",
    birthDate: patient.birthDate ?? "",
    phone: patient.phone,
    email: patient.email ?? "",
    insurance: patient.insurance === "Particular" ? "" : patient.insurance,
    insuranceId: patient.insuranceId ?? "",
    affiliateNumber: patient.affiliateNumber ?? "",
    insurancePlan: patient.insurancePlan ?? "",
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

  if (!errors.dni) {
    const cuilError = cuilFormatValidationError(values.cuil, values.dni);
    if (cuilError) errors.cuil = cuilError;
  }

  const birthDateError = birthDateValidationError(values.birthDate, options?.today);
  if (birthDateError) errors.birthDate = birthDateError;

  const phoneError = requiredFieldError(values.phone, "El teléfono es obligatorio");
  if (phoneError) errors.phone = phoneError;

  const emailError = emailValidationError(values.email);
  if (emailError) errors.email = emailError;

  return errors;
}

/** CUIL (solo dígitos) y fecha de nacimiento (dd-MM-yyyy) listos para guardar. */
export function normalizeIdentityFields(values: Pick<PatientFormValues, "cuil" | "birthDate">) {
  return {
    cuil: normalizeCuil(values.cuil) || undefined,
    birthDate: normalizeBirthDateInput(values.birthDate) || undefined,
  };
}
