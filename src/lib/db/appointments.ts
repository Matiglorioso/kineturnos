import { mapAppointment } from "@/lib/db/mappers";
import { prisma } from "@/lib/prisma";
import type { Appointment } from "@/types";

export async function getAppointmentsFromDb(): Promise<Appointment[]> {
  const records = await prisma.turno.findMany({
    orderBy: [{ fecha: "asc" }, { hora: "asc" }],
  });

  return records.map(mapAppointment);
}
