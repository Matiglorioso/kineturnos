import { mapPatient } from "@/lib/db/mappers";
import { prisma } from "@/lib/prisma";
import type { Patient } from "@/types";

export async function getPatientsFromDb(): Promise<Patient[]> {
  const records = await prisma.paciente.findMany({
    orderBy: { nombre: "asc" },
  });

  return records.map(mapPatient);
}

export async function getPatientByIdFromDb(id: string): Promise<Patient | null> {
  const record = await prisma.paciente.findUnique({ where: { id } });
  return record ? mapPatient(record) : null;
}
