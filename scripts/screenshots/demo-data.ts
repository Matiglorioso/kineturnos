/**
 * Datos de demostración para las capturas de pantalla: un consultorio con dos
 * meses y medio de operación, turnos alrededor de hoy y casos que muestran los
 * avisos (asistencia por registrar, turnos por confirmar, autorizaciones
 * vencidas o por renovar). Nombres ficticios. Solo para una base descartable.
 */
import { hashPassword } from "@/lib/auth/password";
import { addDays } from "date-fns";
import type { EstadoTurno, PrismaClient } from "@prisma/client";

/** Parte de un email sin tildes ni mayúsculas ("Martín" → "martin"). */
function emailPart(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

const FIRST = [
  "Ana", "Juan", "María", "Carlos", "Lucía", "Diego", "Sofía", "Martín", "Valentina", "Tomás", "Camila", "Lucas",
  "Julieta", "Mateo", "Florencia", "Nicolás", "Agustina", "Federico", "Rocío", "Gonzalo", "Micaela", "Ignacio",
  "Carolina", "Emiliano", "Paula", "Santiago", "Romina", "Joaquín", "Victoria", "Bruno",
];
const LAST = [
  "Torres", "Pérez", "Gómez", "Fernández", "Ruiz", "Díaz", "Romero", "Sosa", "Álvarez", "Acosta", "Benítez", "Medina",
  "Herrera", "Castro", "Molina", "Ortiz", "Silva", "Rojas", "Núñez", "Luna", "Vega", "Cabrera", "Ríos", "Godoy",
  "Morales", "Peralta", "Ledesma", "Correa", "Ibarra", "Figueroa",
];
const PROFESSIONALS = [
  { first: "Laura", last: "Méndez", specialty: "Traumatología", days: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"] },
  { first: "Diego", last: "Ferreyra", specialty: "Deportiva", days: ["Lunes", "Miércoles", "Viernes", "Sábado"] },
  { first: "Paula", last: "Quiroga", specialty: "Respiratoria", days: ["Martes", "Jueves", "Sábado"] },
  { first: "Martín", last: "Aguirre", specialty: "RPG", days: ["Lunes", "Martes", "Jueves", "Viernes"] },
  { first: "Sofía", last: "Barrios", specialty: "Neurológica", days: ["Lunes", "Miércoles", "Jueves", "Viernes"] },
];
const COLORS = ["bg-brand-500", "bg-sky-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500"];
const INSURANCES = ["OSDE", "Swiss Medical", "Galeno", "APROSS"];
const SESSION_TYPES = ["Rehabilitación", "Rehabilitación", "Control", "Evaluación inicial", "Deportiva", "RPG"];
const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const EVOLUTIONS = [
  "Buena tolerancia al ejercicio. Disminuye el dolor (EVA 4/10). Se progresa la carga.",
  "Mejora del rango de movimiento. Se agregan ejercicios de propiocepción.",
  "Refiere molestias leves al final de la sesión. Se mantiene el plan y se indica hielo.",
  "Marcha sin asistencia. Se trabaja fortalecimiento de cuádriceps y glúteo medio.",
  "Sin dolor en reposo. Se incorporan ejercicios funcionales y domiciliarios.",
];

export interface DemoData {
  password: string;
  adminEmail: string;
  professionalEmail: string;
  /** Paciente con historia clínica completa (alertas, objetivos, evoluciones). */
  featuredPatientId: string;
  featuredPatientName: string;
  insuranceId: string;
}

function random(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const dbDate = (date: Date) => new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
const dbHour = (hour: number) => new Date(Date.UTC(1970, 0, 1, hour, 0, 0));

export async function seedDemo(db: PrismaClient, password: string): Promise<DemoData> {
  const rand = random(1505);
  const pick = <T>(items: T[]) => items[Math.floor(rand() * items.length)];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Hora actual en Buenos Aires: los turnos de hoy anteriores quedan "por registrar".
  const nowHour = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: "America/Argentina/Buenos_Aires", hour: "2-digit", hourCycle: "h23" }).format(
      new Date()
    )
  );

  const insurances = INSURANCES.map((name, index) => ({
    id: `demo-os-${index}`,
    nombre: name,
    nombreNormalizado: name.toLowerCase(),
  }));
  await db.obraSocial.createMany({ data: insurances });

  const professionals = PROFESSIONALS.map((item, index) => ({
    id: `demo-prof-${index}`,
    nombre: `${item.first} ${item.last}`,
    nombrePila: item.first,
    apellido: item.last,
    matricula: `MP ${4210 + index * 37}`,
    matriculaNormalizada: `MP${4210 + index * 37}`,
    email: `${emailPart(item.first)}.${emailPart(item.last)}@sanmarsalud.com`,
    telefono: `+54 351 15${String(5000000 + index * 13579).slice(0, 7)}`,
    especialidad: item.specialty,
    diasAtencion: item.days,
    colorAvatar: COLORS[index % COLORS.length],
  }));
  await db.profesional.createMany({ data: professionals });

  // Nombres únicos sin numeración: combinaciones de nombre y apellido mezcladas.
  const combos = FIRST.flatMap((first) => LAST.map((last) => [first, last] as const));
  for (let index = combos.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(rand() * (index + 1));
    [combos[index], combos[swap]] = [combos[swap], combos[index]];
  }
  const patients = combos.slice(0, 140).map(([first, last], index) => {
    const dni = String(24_000_000 + Math.floor(rand() * 20_000_000));
    const insurance = rand() < 0.65 ? insurances[index % insurances.length] : null;
    const birth = addDays(today, -Math.floor(365 * (18 + rand() * 55)));
    return {
      id: `demo-pac-${index}`,
      nombre: `${first} ${last}`,
      nombrePila: first,
      apellido: last,
      dni,
      dniNormalizado: dni,
      fechaNacimiento: dbDate(birth),
      telefono: `+54 351 15${String(4000000 + index * 7919).slice(0, 7)}`,
      email: `${emailPart(first)}.${emailPart(last)}@mail.com`,
      obraSocial: insurance?.nombre ?? "Particular",
      obraSocialId: insurance?.id ?? null,
      nroAfiliado: insurance ? `${60000000 + index * 97}/0${index % 3}` : null,
      planObraSocial: insurance?.nombre === "OSDE" ? "310" : null,
      fechaAlta: dbDate(addDays(today, -90 - (index % 60))),
    };
  });
  await db.paciente.createMany({ data: patients });
  const featured = patients.find((patient) => patient.obraSocialId)!;

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
  const busyPatient = new Set<string>();

  for (let offset = -75; offset <= 14; offset += 1) {
    const day = addDays(today, offset);
    if (day.getDay() === 0) continue;
    const working = professionals.filter((professional) => professional.diasAtencion.includes(WEEKDAYS[day.getDay()]));
    const slots = working.flatMap((professional) =>
      Array.from({ length: 10 }, (_, hour) => ({ professional, hour: 8 + hour }))
    );
    for (let index = slots.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(rand() * (index + 1));
      [slots[index], slots[swap]] = [slots[swap], slots[index]];
    }
    // ~70 % de ocupación los días hábiles, menos los sábados y más adelante en el tiempo.
    const ratio = day.getDay() === 6 ? 0.45 : offset > 7 ? 0.35 : 0.7;
    for (const { professional, hour } of slots.slice(0, Math.round(slots.length * ratio))) {
      // El paciente destacado tiene sesiones dos veces por semana con la misma profesional.
      let patient = pick(patients);
      if (professional.id === "demo-prof-0" && hour === 9 && (day.getDay() === 1 || day.getDay() === 4)) {
        patient = featured;
      }
      const key = `${patient.id}-${offset}-${hour}`;
      if (busyPatient.has(key)) continue;
      busyPatient.add(key);

      const roll = rand();
      const pastToday = offset === 0 && hour < nowHour;
      const estado: EstadoTurno =
        offset < 0
          ? roll < 0.8 ? "atendido" : roll < 0.9 ? "ausente" : "cancelado"
          : pastToday
            ? roll < 0.6 ? "atendido" : "confirmado"
            : offset <= 1
              ? roll < 0.55 ? "confirmado" : "pendiente"
              : roll < 0.4 ? "confirmado" : roll < 0.95 ? "pendiente" : "cancelado";
      appointments.push({
        id: `demo-tur-${appointments.length}`,
        pacienteId: patient.id,
        profesionalId: professional.id,
        pacienteNombre: patient.nombre,
        profesionalNombre: professional.nombre,
        fecha: dbDate(day),
        hora: dbHour(hour),
        estado,
        tipoSesion: patient.id === featured.id ? "Rehabilitación" : pick(SESSION_TYPES),
      });
    }
  }
  await db.turno.createMany({ data: appointments });

  // Autorizaciones: la mayoría vigentes, algunas vencidas, por vencer o en trámite.
  const authorizations = patients
    .filter((patient) => patient.obraSocialId)
    .map((patient, index) => {
      const kind = index % 10;
      const from = addDays(today, kind === 0 ? -120 : -45);
      const until = kind === 0 ? addDays(today, -20) : kind === 1 ? addDays(today, 5) : addDays(today, 45);
      return {
        id: `demo-aut-${index}`,
        pacienteId: patient.id,
        obraSocialId: patient.obraSocialId!,
        numero: `${String(880000 + index * 31)}`,
        estado: kind === 2 ? ("pendiente" as const) : ("aprobada" as const),
        sesiones: kind === 3 ? 4 : 10,
        fechaDesde: dbDate(from),
        vencimiento: dbDate(until),
        creadoPorNombre: "Julieta Paz",
      };
    });
  await db.autorizacion.createMany({ data: authorizations });

  // Cada sesión atendida descuenta de la autorización aprobada vigente, como hace la app.
  for (const authorization of authorizations.filter((item) => item.estado === "aprobada")) {
    const covered = appointments
      .filter(
        (appointment) =>
          appointment.pacienteId === authorization.pacienteId &&
          appointment.estado === "atendido" &&
          appointment.fecha >= authorization.fechaDesde &&
          appointment.fecha <= authorization.vencimiento
      )
      .slice(0, authorization.sesiones)
      .map((appointment) => appointment.id);
    if (covered.length > 0) {
      await db.turno.updateMany({ where: { id: { in: covered } }, data: { autorizacionId: authorization.id } });
    }
  }

  const passwordHash = await hashPassword(password);
  const adminEmail = "julieta.paz@sanmarsalud.com";
  const professionalEmail = professionals[0].email!;
  const lastLogin = (daysAgo: number, hour: number) => {
    const date = addDays(new Date(), -daysAgo);
    date.setHours(hour, 12, 0, 0);
    return date;
  };
  await db.usuario.createMany({
    data: [
      { id: "demo-u-admin", email: adminEmail, nombre: "Julieta Paz", passwordHash, rol: "admin", ultimoIngreso: lastLogin(0, 8) },
      {
        id: "demo-u-dueno",
        email: "direccion@sanmarsalud.com",
        nombre: "Ricardo Funes",
        passwordHash,
        rol: "admin",
        ultimoIngreso: lastLogin(1, 18),
      },
      ...professionals.slice(0, 4).map((professional, index) => ({
        id: `demo-u-prof-${index}`,
        email: professional.email!,
        nombre: professional.nombre,
        passwordHash,
        rol: "profesional" as const,
        profesionalId: professional.id,
        ultimoIngreso: index === 3 ? null : lastLogin(index, 9 + index),
        debeCambiarPassword: index === 3,
      })),
      { id: "demo-u-soporte", email: "soporte@kineturnos.app", nombre: "Soporte técnico", passwordHash, rol: "superadmin" },
    ],
  });

  // Historia clínica: evoluciones de la mitad de las sesiones atendidas; el paciente destacado, todas.
  const attended = appointments.filter((appointment) => appointment.estado === "atendido");
  const clinical = attended
    .filter((appointment) => appointment.pacienteId === featured.id || rand() < 0.5)
    .map((appointment, index) => {
      const isFeatured = appointment.pacienteId === featured.id;
      return {
        id: `demo-hc-${index}`,
        pacienteId: appointment.pacienteId,
        profesionalId: appointment.profesionalId,
        profesionalNombre: appointment.profesionalNombre,
        turnoId: appointment.id,
        autorId: "demo-u-prof-0",
        autorNombre: appointment.profesionalNombre,
        fecha: appointment.fecha,
        diagnostico: isFeatured && index % 6 === 0 ? "Posoperatorio de LCA de rodilla derecha (8 semanas)." : null,
        tratamiento:
          isFeatured && index % 6 === 0
            ? "Fortalecimiento progresivo, propiocepción y reeducación de la marcha. Dos sesiones por semana."
            : null,
        evolucion: pick(EVOLUTIONS),
      };
    });
  await db.historiaClinica.createMany({ data: clinical });

  await db.fichaClinica.create({
    data: {
      pacienteId: featured.id,
      alertas: "Alergia a la penicilina\nHipertensión controlada",
      antecedentes: "Cirugía de ligamento cruzado anterior (agosto de 2026). Practica fútbol amateur.",
      actualizadoPorNombre: professionals[0].nombre,
    },
  });
  await db.objetivoTratamiento.createMany({
    data: [
      { id: "demo-obj-0", pacienteId: featured.id, descripcion: "Extensión completa de rodilla", cumplido: true, cumplidoEn: new Date(), creadoPorNombre: professionals[0].nombre },
      { id: "demo-obj-1", pacienteId: featured.id, descripcion: "Marcha sin dolor ni asistencia", cumplido: true, cumplidoEn: new Date(), creadoPorNombre: professionals[0].nombre },
      { id: "demo-obj-2", pacienteId: featured.id, descripcion: "Volver a correr a las 16 semanas", creadoPorNombre: professionals[0].nombre },
    ],
  });

  return {
    password,
    adminEmail,
    professionalEmail,
    featuredPatientId: featured.id,
    featuredPatientName: featured.nombre,
    insuranceId: featured.obraSocialId!,
  };
}
