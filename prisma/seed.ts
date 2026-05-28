import { PrismaClient } from "@prisma/client";
import { mockAppointments } from "../src/data/mockAppointments";
import { mockPatients } from "../src/data/mockPatients";
import { mockProfessionals } from "../src/data/mockProfessionals";

const prisma = new PrismaClient();

async function main() {
  console.log("Limpiando tablas...");
  await prisma.appointment.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.professional.deleteMany();

  console.log("Insertando profesionales...");
  for (const professional of mockProfessionals) {
    await prisma.professional.create({
      data: {
        id: professional.id,
        name: professional.name,
        firstName: professional.firstName,
        lastName: professional.lastName,
        license: professional.license,
        email: professional.email,
        phone: professional.phone,
        specialty: professional.specialty,
        days: professional.days,
        scheduleStart: professional.scheduleStart,
        scheduleEnd: professional.scheduleEnd,
        defaultDuration: professional.defaultDuration,
        active: professional.active,
        avatarColor: professional.avatarColor,
        notes: professional.notes,
      },
    });
  }

  console.log("Insertando pacientes...");
  for (const patient of mockPatients) {
    await prisma.patient.create({
      data: {
        id: patient.id,
        name: patient.name,
        firstName: patient.firstName,
        lastName: patient.lastName,
        dni: patient.dni,
        phone: patient.phone,
        insurance: patient.insurance,
        email: patient.email,
        notes: patient.notes,
        status: patient.status,
        lastAppointment: patient.lastAppointment,
        createdAt: patient.createdAt,
      },
    });
  }

  console.log("Insertando turnos...");
  for (const appointment of mockAppointments) {
    await prisma.appointment.create({
      data: {
        id: appointment.id,
        patientId: appointment.patientId,
        professionalId: appointment.professionalId,
        patientName: appointment.patientName,
        professionalName: appointment.professionalName,
        date: appointment.date,
        time: appointment.time,
        duration: appointment.duration,
        status: appointment.status,
        sessionType: appointment.sessionType,
        notes: appointment.notes,
      },
    });
  }

  const counts = {
    professionals: await prisma.professional.count(),
    patients: await prisma.patient.count(),
    appointments: await prisma.appointment.count(),
  };

  console.log("Seed completado:", counts);
}

main()
  .catch((error) => {
    console.error("Error en seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
