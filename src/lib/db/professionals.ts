import { mapProfessional } from "@/lib/db/mappers";
import { DeleteBlockedError, DuplicateFieldError } from "@/lib/db/errors";
import {
  professionalToWriteInput,
  resolveProfessionalId,
  toProfesionalWriteData,
  type ProfessionalWriteInput,
} from "@/lib/db/professional-write";
import {
  DUPLICATE_LICENSE_MESSAGE,
  normalizeLicense,
} from "@/lib/document-validation";
import { prisma } from "@/lib/prisma";
import type { Professional } from "@/types";

export type { ProfessionalWriteInput } from "@/lib/db/professional-write";
export { professionalToWriteInput } from "@/lib/db/professional-write";

export async function getProfessionalsFromDb(): Promise<Professional[]> {
  const records = await prisma.profesional.findMany({
    orderBy: { nombre: "asc" },
  });

  return records.map(mapProfessional);
}

export async function getProfessionalByIdFromDb(
  id: string
): Promise<Professional | null> {
  const record = await prisma.profesional.findUnique({ where: { id } });
  return record ? mapProfessional(record) : null;
}

export async function assertProfessionalLicenseAvailable(
  license: string,
  excludeId?: string
): Promise<void> {
  const matriculaNormalizada = normalizeLicense(license);
  if (!matriculaNormalizada) return;

  const existing = await prisma.profesional.findUnique({
    where: { matriculaNormalizada },
  });

  if (existing && existing.id !== excludeId) {
    throw new DuplicateFieldError("license", DUPLICATE_LICENSE_MESSAGE);
  }
}

export async function createProfessionalInDb(
  input: ProfessionalWriteInput
): Promise<Professional> {
  await assertProfessionalLicenseAvailable(input.license);

  const record = await prisma.profesional.create({
    data: {
      id: resolveProfessionalId(input),
      ...toProfesionalWriteData(input),
    },
  });

  return mapProfessional(record);
}

export async function updateProfessionalInDb(
  id: string,
  input: ProfessionalWriteInput
): Promise<Professional> {
  await assertProfessionalLicenseAvailable(input.license, id);

  const record = await prisma.profesional.update({
    where: { id },
    data: toProfesionalWriteData(input),
  });

  return mapProfessional(record);
}

export async function countProfessionalAppointmentsInDb(
  professionalId: string
): Promise<number> {
  return prisma.turno.count({ where: { profesionalId: professionalId } });
}

export async function deleteProfessionalFromDb(id: string): Promise<void> {
  const appointmentCount = await countProfessionalAppointmentsInDb(id);

  if (appointmentCount > 0) {
    throw new DeleteBlockedError(
      `No se puede eliminar el profesional porque tiene ${appointmentCount} turno(s) asignado(s).`
    );
  }

  await prisma.profesional.delete({ where: { id } });
}
