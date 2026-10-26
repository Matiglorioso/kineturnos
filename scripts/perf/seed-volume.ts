/**
 * Carga de volumen para las pruebas de rendimiento (RNF03, RNF04): el
 * consultorio con varios meses de operación a 40 turnos por día hábil.
 * Solo se usa sobre una base descartable creada por `scripts/perf/run.ts`.
 */
import { hashPassword } from "@/lib/auth/password";
import { addDays } from "date-fns";
import type { EstadoTurno, PrismaClient } from "@prisma/client";

export interface VolumeOptions {
  /** Días hacia atrás desde hoy con turnos. */
  pastDays: number;
  /** Días hacia adelante con turnos agendados. */
  futureDays: number;
  /** Turnos por día de lunes a viernes (los sábados, la mitad). */
  perWeekday: number;
  professionals: number;
  patients: number;
}

export const DEFAULT_VOLUME: VolumeOptions = {
  pastDays: 180,
  futureDays: 30,
  perWeekday: 40,
  professionals: 8,
  patients: 500,
};

export interface VolumeResult {
  counts: Record<string, number>;
  adminEmail: string;
  professionalEmail: string;
  password: string;
  /** Profesionales sin turnos, para medir las altas sin chocar horarios (uno por recepcionista). */
  freeProfessionalIds: string[];
  samplePatientId: string;
}

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const COLORS = ["bg-brand-500", "bg-sky-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];
const FIRST = ["Ana", "Juan", "María", "Carlos", "Lucía", "Diego", "Sofía", "Martín", "Valentina", "Tomás", "Camila", "Lucas"];
const LAST = ["Torres", "Pérez", "Gómez", "Fernández", "Ruiz", "Díaz", "Romero", "Sosa", "Álvarez", "Acosta", "Benítez", "Medina"];
const INSURANCES = ["OSDE", "Swiss Medical", "Galeno", "APROSS"];
const SESSION_TYPES = ["Rehabilitación", "Evaluación inicial", "Deportiva", "Control"];

/** Aleatorio reproducible (misma carga en cada corrida). */
function random(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const dbDate = (date: Date) => new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
const dbHour = (hour: number) => new Date(Date.UTC(1970, 0, 1, hour, 0, 0));

async function insertInChunks<T>(rows: T[], insert: (chunk: T[]) => Promise<unknown>) {
  for (let index = 0; index < rows.length; index += 1000) {
    await insert(rows.slice(index, index + 1000));
  }
}

export async function seedVolume(
  db: PrismaClient,
  password: string,
  options: VolumeOptions = DEFAULT_VOLUME
): Promise<VolumeResult> {
  const rand = random(20261026);
  const pick = <T>(items: T[]) => items[Math.floor(rand() * items.length)];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const insurances = INSURANCES.map((name, index) => ({
    id: `perf-os-${index}`,
    nombre: name,
    nombreNormalizado: name.toLowerCase(),
  }));
  await db.obraSocial.createMany({ data: insurances });

  // Dos de más, sin turnos: ahí se miden las altas.
  const professionals = Array.from({ length: options.professionals + 2 }, (_, index) => {
    const first = FIRST[index % FIRST.length];
    const last = `${LAST[(index * 5) % LAST.length]} ${index + 1}`;
    return {
      id: `perf-prof-${index}`,
      nombre: `${first} ${last}`,
      nombrePila: first,
      apellido: last,
      matricula: `MN${100000 + index}`,
      matriculaNormalizada: `MN${100000 + index}`,
      especialidad: "Rehabilitación general",
      diasAtencion: DAYS,
      colorAvatar: COLORS[index % COLORS.length],
    };
  });
  await db.profesional.createMany({ data: professionals });
  const working = professionals.slice(0, options.professionals);

  const patients = Array.from({ length: options.patients }, (_, index) => {
    const first = pick(FIRST);
    const last = `${pick(LAST)} ${index + 1}`;
    const dni = String(20_000_000 + index * 37);
    const insurance = rand() < 0.6 ? insurances[index % insurances.length] : null;
    return {
      id: `perf-pac-${index}`,
      nombre: `${first} ${last}`,
      nombrePila: first,
      apellido: last,
      dni,
      dniNormalizado: dni,
      telefono: `+54 11 5${String(1000000 + index).slice(1)}`,
      email: `paciente${index}@perf.local`,
      obraSocial: insurance?.nombre ?? "Particular",
      obraSocialId: insurance?.id ?? null,
      nroAfiliado: insurance ? `${100000 + index}/01` : null,
      fechaAlta: dbDate(addDays(today, -options.pastDays - 30)),
    };
  });
  await insertInChunks(patients, (data) => db.paciente.createMany({ data }));

  const authorizations = patients
    .filter((patient) => patient.obraSocialId)
    .map((patient, index) => ({
      id: `perf-aut-${index}`,
      pacienteId: patient.id,
      obraSocialId: patient.obraSocialId!,
      numero: `A-${10000 + index}`,
      estado: "aprobada" as const,
      sesiones: 10,
      fechaDesde: dbDate(addDays(today, -60)),
      vencimiento: dbDate(addDays(today, 60)),
      creadoPorNombre: "Carga de rendimiento",
    }));
  await insertInChunks(authorizations, (data) => db.autorizacion.createMany({ data }));

  const appointments: {
    id: string;
    pacienteId: string;
    profesionalId: string;
    pacienteNombre: string;
    profesionalNombre: string;
    fecha: Date;
    hora: Date;
    estado: EstadoTurno;
    tipoSesion: string;
  }[] = [];

  for (let offset = -options.pastDays; offset <= options.futureDays; offset += 1) {
    const day = addDays(today, offset);
    if (day.getDay() === 0) continue;
    const perDay = day.getDay() === 6 ? Math.round(options.perWeekday / 2) : options.perWeekday;

    // Bloques libres del día (profesional × hora), sin solapamientos.
    const slots = working.flatMap((professional) =>
      Array.from({ length: 10 }, (_, hour) => ({ professional, hour: 8 + hour }))
    );
    for (let index = slots.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(rand() * (index + 1));
      [slots[index], slots[swap]] = [slots[swap], slots[index]];
    }

    for (const { professional, hour } of slots.slice(0, perDay)) {
      const patient = pick(patients);
      const roll = rand();
      const estado: EstadoTurno =
        offset < 0
          ? roll < 0.8 ? "atendido" : roll < 0.9 ? "ausente" : "cancelado"
          : roll < 0.6 ? "confirmado" : roll < 0.95 ? "pendiente" : "cancelado";
      appointments.push({
        id: `perf-tur-${appointments.length}`,
        pacienteId: patient.id,
        profesionalId: professional.id,
        pacienteNombre: patient.nombre,
        profesionalNombre: professional.nombre,
        fecha: dbDate(day),
        hora: dbHour(hour),
        estado,
        tipoSesion: pick(SESSION_TYPES),
      });
    }
  }
  await insertInChunks(appointments, (data) => db.turno.createMany({ data }));

  const passwordHash = await hashPassword(password);
  const adminEmail = "perf-admin@perf.local";
  const professionalEmail = "perf-profesional@perf.local";
  await db.usuario.createMany({
    data: [
      { id: "perf-u-admin", email: adminEmail, nombre: "Recepción (rendimiento)", passwordHash, rol: "admin" },
      {
        id: "perf-u-prof",
        email: professionalEmail,
        nombre: working[0].nombre,
        passwordHash,
        rol: "profesional",
        profesionalId: working[0].id,
      },
    ],
  });

  // Historia clínica: una evolución por la mitad de las sesiones atendidas.
  const clinical = appointments
    .filter((appointment) => appointment.estado === "atendido" && rand() < 0.5)
    .map((appointment, index) => ({
      id: `perf-hc-${index}`,
      pacienteId: appointment.pacienteId,
      profesionalId: appointment.profesionalId,
      profesionalNombre: appointment.profesionalNombre,
      turnoId: appointment.id,
      autorId: "perf-u-prof",
      autorNombre: appointment.profesionalNombre,
      fecha: appointment.fecha,
      evolucion: "Buena evolución. Se progresa la carga y se indican ejercicios domiciliarios.",
    }));
  await insertInChunks(clinical, (data) => db.historiaClinica.createMany({ data }));

  return {
    counts: {
      profesionales: professionals.length,
      pacientes: patients.length,
      obrasSociales: insurances.length,
      autorizaciones: authorizations.length,
      turnos: appointments.length,
      historiaClinica: clinical.length,
    },
    adminEmail,
    professionalEmail,
    password,
    freeProfessionalIds: professionals.slice(options.professionals).map((professional) => professional.id),
    samplePatientId: patients[0].id,
  };
}
