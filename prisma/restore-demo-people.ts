import { PrismaClient } from "@prisma/client";
import { optionalAppDateToDb } from "../src/lib/db/date-codec";
import { normalizeDni, normalizeLicense } from "../src/lib/document-validation";
import { resolveNameParts } from "../src/lib/person-name";
import type { Patient } from "../src/types";
import { mockPatients } from "./fixtures/mockPatients";
import { mockProfessionals } from "./fixtures/mockProfessionals";

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
    ultimoTurno: optionalAppDateToDb(patient.lastAppointment),
    fechaAlta: optionalAppDateToDb(patient.createdAt),
  };
}

async function main() {
  let profesionales = 0;
  for (const professional of mockProfessionals) {
    await prisma.profesional.upsert({
      where: { id: professional.id },
      create: {
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
        activo: professional.active,
        colorAvatar: professional.avatarColor,
        observaciones: professional.notes ?? null,
      },
      update: {
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
        activo: professional.active,
        colorAvatar: professional.avatarColor,
        observaciones: professional.notes ?? null,
      },
    });
    profesionales += 1;
  }

  let pacientes = 0;
  for (const patient of mockPatients) {
    const data = buildPacienteSeedData(patient);
    await prisma.paciente.upsert({
      where: { id: patient.id },
      create: data,
      update: data,
    });
    pacientes += 1;
  }

  const first = mockProfessionals[0];
  if (first) {
    await prisma.usuario.updateMany({
      where: { id: "u-profe" },
      data: { profesionalId: first.id, nombre: first.name },
    });
  }

  const turnos = await prisma.turno.count();

  console.log("Mocks restaurados (sin turnos):", {
    profesionales,
    pacientes,
    turnos,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
