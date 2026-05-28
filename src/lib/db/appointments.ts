import { mapAppointment } from "@/lib/db/mappers";
import { prisma } from "@/lib/prisma";
import type { Appointment } from "@/types";

export async function getAppointmentsFromDb(): Promise<Appointment[]> {
  const records = await prisma.appointment.findMany({
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  return records.map(mapAppointment);
}
