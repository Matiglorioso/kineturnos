import { mapProfessional } from "@/lib/db/mappers";
import { prisma } from "@/lib/prisma";
import type { Professional } from "@/types";

export async function getProfessionalsFromDb(): Promise<Professional[]> {
  const records = await prisma.profesional.findMany({
    orderBy: { nombre: "asc" },
  });

  return records.map(mapProfessional);
}
