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
/** Evoluciones por zona, como las escribe un kinesiólogo (abreviaturas y medidas habituales). */
const EVOLUTIONS: Record<string, string[]> = {
  rodilla: [
    "Refiere leve molestia en flexión >90°. Se trabaja movilidad pasiva, isométricos de cuádriceps a 60° y crioterapia 15 min.",
    "EVA 3/10 al bajar escaleras. Sentadilla 0–60° 3×12, step-up 15 cm y bicicleta 10 min sin resistencia. Buena tolerancia.",
    "Leve derrame (+) que cede con MLD. Se mantiene la carga, se agrega propiocepción en bosu bipodal.",
    "Sin dolor en reposo. Prensa 30 kg 3×10, puente glúteo y elongación de isquiotibiales. Se indican ejercicios domiciliarios.",
  ],
  hombro: [
    "Dolor 4/10 en elevación por encima de 120°, arco doloroso (+). Pendulares, movilidad activo-asistida con bastón y TENS 20 min.",
    "Mejora la RE (45° → 60°). Isométricos de manguito rotador y estabilización escapular en pared. Hielo 10 min.",
    "Refiere menos dolor nocturno. Se progresa a banda elástica (RE/RI 3×15) y remo bajo. Sin dolor al finalizar.",
    "Elevación activa completa con leve compensación escapular. Trabajo excéntrico de supraespinoso y control motor.",
  ],
  lumbar: [
    "Lumbalgia mecánica, EVA 5/10 en flexión de tronco. Calor húmedo 15 min, movilidad en cuadrupedia y activación de transverso.",
    "Disminuye la irradiación a glúteo izq. Puente, bird-dog 3×10 y elongación de psoas. Se dan pautas de higiene postural.",
    "EVA 2/10. Se incorporan peso muerto con palo y plancha 3×20 s. Tolera bien la progresión.",
    "Sin dolor en actividades de la vida diaria. Se refuerza el plan domiciliario y se espacian las sesiones.",
  ],
  tobillo: [
    "Esguince grado II de tobillo der. (día 12). Edema perimaleolar (+), movilidad activa en descarga y crioterapia 15 min.",
    "Marcha sin claudicación. Dorsiflexión en carga 8 cm (contralateral 11 cm). Elevaciones de talón y apoyo monopodal 3×30 s.",
    "Sin edema. Propiocepción en superficie inestable y saltos bipodales submáximos. EVA 1/10.",
    "Y-balance sin diferencias relevantes. Se trabajan cambios de dirección a baja velocidad.",
  ],
  cervical: [
    "Cervicalgia con contractura de trapecio superior der. Masoterapia 10 min, movilidad activa y estiramientos suaves.",
    "Menos cefalea tensional esta semana. Activación de flexores profundos (biofeedback 22 → 26 mmHg) y retracciones.",
    "Rotación activa completa sin dolor. Se agregan ejercicios de estabilización escapular y pausas activas en el trabajo.",
  ],
};
const EVOLUTION_AREAS = Object.keys(EVOLUTIONS);

/** Posoperatorio de LCA del paciente destacado, de la primera sesión a la última. */
const FEATURED_EVOLUTIONS = [
  "Evaluación inicial. Posop. LCA rodilla der. (8 sem.). Flexión activa 0–95°, déficit de extensión 3°. Edema (++). Se pauta plan y ejercicios domiciliarios.",
  "Refiere dolor 4/10 en cara anterior al final del día. MLD 10 min, NMES de VMO 20 min y movilidad pasiva. Crioterapia 15 min.",
  "Flexión activa 0–102°, extensión completa. Isométricos de cuádriceps, elevación de pierna recta 3×12 y bicicleta sin resistencia.",
  "Disminuye el edema (+). Marcha sin muletas en distancias cortas. Sentadilla a 45° 3×10 y transferencias de peso.",
  "Refiere leve molestia en flexión >90°. Se trabaja movilidad pasiva y crioterapia 15 min. Se progresa carga en prensa a 20 kg.",
  "Flexión 0–112°. Step-up 10 cm, puente monopodal y propiocepción bipodal en bosu. EVA 2/10 al finalizar.",
  "Marcha sin ayudas técnicas, leve claudicación al final de la sesión. Excéntricos de isquiotibiales y prensa 30 kg 3×10.",
  "Refiere dolor 3/10 al bajar escaleras. Se ajusta la carga; isométricos a 60° y elongación de cadena posterior.",
  "Flexión activa 0–118°, ext. completa. Sentadilla 0–60° 3×12, step-up 20 cm y propiocepción monopodal. Buena tolerancia.",
  "Sin dolor en reposo. Leve edema perirrotuliano (+). NMES de VMO 20 min y trabajo de control motor en apoyo monopodal.",
  "Prensa 40 kg 3×10 y bicicleta 15 min con resistencia leve. Lachman sin cambios respecto de la evaluación previa.",
  "Se incorporan saltos bipodales submáximos y cambios de dirección a baja velocidad. Sin derrame posterior a la sesión.",
  "Trote en cinta 5 min a 7 km/h sin dolor. Fuerza de cuádriceps (dinamometría) 78 % respecto del contralateral.",
  "Buena respuesta a la progresión. Pliometría de bajo impacto y estabilidad en superficie inestable. Se mantiene el plan.",
];

export interface DemoData {
  password: string;
  adminEmail: string;
  /** Acceso técnico: es el único perfil que ve la auditoría. */
  superadminEmail: string;
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

/** UUID v4 a partir de un generador con semilla: mismo formato que la app, siempre los mismos. */
function uuidFactory(seed: number) {
  const next = random(seed);
  const hex = (count: number) =>
    Array.from({ length: count }, () => Math.floor(next() * 16).toString(16)).join("");
  return () =>
    `${hex(8)}-${hex(4)}-4${hex(3)}-${(8 + Math.floor(next() * 4)).toString(16)}${hex(3)}-${hex(12)}`;
}

export async function seedDemo(db: PrismaClient, password: string): Promise<DemoData> {
  const rand = random(1505);
  const uuid = uuidFactory(7331);
  // Minutos entre la sesión y su registro, con su propio generador (no cambia el resto de la demo).
  const lag = random(2718);
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
    id: uuid(),
    nombre: name,
    nombreNormalizado: name.toLowerCase(),
  }));
  await db.obraSocial.createMany({ data: insurances });

  const professionals = PROFESSIONALS.map((item, index) => ({
    id: uuid(),
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
      id: uuid(),
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
  const otherPatients = patients.filter((patient) => patient.id !== featured.id);

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
      // El resto de los turnos no le toca al destacado (no tiene dos sesiones el mismo día).
      let patient = pick(otherPatients);
      if (professional.id === professionals[0].id && hour === 9 && (day.getDay() === 1 || day.getDay() === 4)) {
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
        id: uuid(),
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
        id: uuid(),
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
  const professionalUserIds = professionals.slice(0, 4).map(() => uuid());
  const adminUserId = uuid();
  await db.usuario.createMany({
    data: [
      { id: adminUserId, email: adminEmail, nombre: "Julieta Paz", passwordHash, rol: "admin", ultimoIngreso: lastLogin(0, 8) },
      {
        id: uuid(),
        email: "direccion@sanmarsalud.com",
        nombre: "Ricardo Funes",
        passwordHash,
        rol: "admin",
        ultimoIngreso: lastLogin(1, 18),
      },
      ...professionals.slice(0, 4).map((professional, index) => ({
        id: professionalUserIds[index],
        email: professional.email!,
        nombre: professional.nombre,
        passwordHash,
        rol: "profesional" as const,
        profesionalId: professional.id,
        ultimoIngreso: index === 3 ? null : lastLogin(index, 9 + index),
        debeCambiarPassword: index === 3,
      })),
      { id: uuid(), email: "soporte@kineturnos.app", nombre: "Soporte técnico", passwordHash, rol: "superadmin" },
    ],
  });

  // Historia clínica: evoluciones de la mitad de las sesiones atendidas; el paciente destacado, todas.
  const attended = appointments
    .filter((appointment) => appointment.estado === "atendido")
    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime() || a.hora.getTime() - b.hora.getTime());
  const userByProfessional = new Map(professionals.slice(0, 4).map((professional, index) => [professional.id, professionalUserIds[index]]));
  const areaOf = (patientId: string) =>
    EVOLUTION_AREAS[[...patientId].reduce((sum, char) => sum + char.charCodeAt(0), 0) % EVOLUTION_AREAS.length];
  const sessionsSoFar = new Map<string, number>();
  const now = Date.now();
  const clinical = attended
    .filter((appointment) => appointment.pacienteId === featured.id || rand() < 0.5)
    .map((appointment) => {
      const isFeatured = appointment.pacienteId === featured.id;
      const count = sessionsSoFar.get(appointment.pacienteId) ?? 0;
      sessionsSoFar.set(appointment.pacienteId, count + 1);
      const texts = isFeatured ? FEATURED_EVOLUTIONS : EVOLUTIONS[areaOf(appointment.pacienteId)];
      // El turno es hora de Buenos Aires (UTC−3); el registro, después de la sesión.
      const sessionStart = Date.UTC(
        appointment.fecha.getUTCFullYear(),
        appointment.fecha.getUTCMonth(),
        appointment.fecha.getUTCDate(),
        appointment.hora.getUTCHours() + 3
      );
      const registered = new Date(
        Math.min(sessionStart + Math.round((20 + lag() * 100) * 60_000) + Math.floor(lag() * 59) * 1000, now - 5 * 60_000)
      );
      const first = isFeatured && count === 0;
      return {
        id: uuid(),
        pacienteId: appointment.pacienteId,
        profesionalId: appointment.profesionalId,
        profesionalNombre: appointment.profesionalNombre,
        turnoId: appointment.id,
        autorId: userByProfessional.get(appointment.profesionalId) ?? adminUserId,
        autorNombre: appointment.profesionalNombre,
        fecha: appointment.fecha,
        diagnostico: first ? "Posoperatorio de LCA de rodilla derecha (8 semanas)." : null,
        tratamiento: first
          ? "Fortalecimiento progresivo, propiocepción y reeducación de la marcha. Dos sesiones por semana."
          : null,
        // El destacado sigue su progresión y después alterna controles de rodilla; el resto rota los de su zona.
        evolucion:
          isFeatured && count >= texts.length
            ? EVOLUTIONS.rodilla[count % EVOLUTIONS.rodilla.length]
            : texts[count % texts.length],
        creadoEn: registered,
        actualizadoEn: registered,
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
      { id: uuid(), pacienteId: featured.id, descripcion: "Extensión completa de rodilla", cumplido: true, cumplidoEn: new Date(), creadoPorNombre: professionals[0].nombre },
      { id: uuid(), pacienteId: featured.id, descripcion: "Marcha sin dolor ni asistencia", cumplido: true, cumplidoEn: new Date(), creadoPorNombre: professionals[0].nombre },
      { id: uuid(), pacienteId: featured.id, descripcion: "Volver a correr a las 16 semanas", creadoPorNombre: professionals[0].nombre },
    ],
  });

  return {
    password,
    adminEmail,
    superadminEmail: "soporte@kineturnos.app",
    professionalEmail,
    featuredPatientId: featured.id,
    featuredPatientName: featured.nombre,
    insuranceId: featured.obraSocialId!,
  };
}
