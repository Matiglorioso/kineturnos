import { PrismaClient } from "@prisma/client";
import { mockAppointments } from "../src/data/mockAppointments";
import { mockPatients } from "../src/data/mockPatients";
import { mockProfessionals } from "../src/data/mockProfessionals";
import { resolveNameParts } from "../src/lib/person-name";
import { normalizeDni, normalizeLicense } from "../src/lib/document-validation";
import type { Patient } from "../src/types";

const prisma = new PrismaClient();

function buildPacienteSeedData(patient: Patient) {
  const { firstName, lastName } = resolveNameParts(
    patient.name,
    patient.firstName,
    patient.lastName
  );

  return {
    id: patient.id,
    nombre: patient.name,
    nombrePila: firstName,
    apellido: lastName,
    dni: patient.dni,
    dniNormalizado: normalizeDni(patient.dni),
    telefono: patient.phone,
    obraSocial: patient.insurance,
    email: patient.email ?? null,
    observaciones: patient.notes ?? null,
    estado: patient.status,
    ultimoTurno: patient.lastAppointment ?? null,
    fechaAlta: patient.createdAt ?? null,
  };
}

async function main() {
  console.log("Limpiando tablas...");
  await prisma.turno.deleteMany();
  await prisma.paciente.deleteMany();
  await prisma.profesional.deleteMany();

  console.log("Insertando profesionales...");
  for (const professional of mockProfessionals) {
    await prisma.profesional.create({
      data: {
        id: professional.id,
        nombre: professional.name,
        nombrePila: professional.firstName,
        apellido: professional.lastName,
        matricula: professional.license ?? null,
        matriculaNormalizada: professional.license
          ? normalizeLicense(professional.license)
          : null,
        email: professional.email ?? null,
        telefono: professional.phone ?? null,
        especialidad: professional.specialty,
        diasAtencion: professional.days,
        horarioInicio: professional.scheduleStart,
        horarioFin: professional.scheduleEnd,
        duracionDefault: professional.defaultDuration,
        activo: professional.active,
        colorAvatar: professional.avatarColor,
        observaciones: professional.notes ?? null,
      },
    });
  }

  console.log("Insertando pacientes...");
  for (const patient of mockPatients) {
    await prisma.paciente.create({
      data: buildPacienteSeedData(patient),
    });
  }

  console.log("Insertando turnos...");
  for (const appointment of mockAppointments) {
    await prisma.turno.create({
      data: {
        id: appointment.id,
        pacienteId: appointment.patientId,
        profesionalId: appointment.professionalId,
        pacienteNombre: appointment.patientName,
        profesionalNombre: appointment.professionalName,
        fecha: appointment.date,
        hora: appointment.time,
        duracion: appointment.duration,
        estado: appointment.status,
        tipoSesion: appointment.sessionType,
        observaciones: appointment.notes ?? null,
      },
    });
  }

  const counts = {
    profesionales: await prisma.profesional.count(),
    pacientes: await prisma.paciente.count(),
    turnos: await prisma.turno.count(),
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
