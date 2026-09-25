import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { APPOINTMENT_OVERLAP_ERROR } from "../../src/lib/appointment-validation";
import { appDateToDb } from "../../src/lib/db/date-codec";
import {
  api,
  appointmentBody,
  cleanupTestData,
  createAppointmentInDb,
  createPatient,
  createProfessional,
  futureWorkday,
  prisma,
  weekdayName,
} from "./helpers";

after(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

type ApiAppointment = {
  id: string;
  status: string;
  sessionType: string;
  patientName: string;
  notes?: string;
};

describe("API de turnos", () => {
  it("GET lista los turnos", async () => {
    const res = await api<unknown[]>("/api/appointments");
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data));
  });

  it("alta, cambio de estado, edición completa y cancelación", async () => {
    const professional = await createProfessional();
    const patient = await createPatient();
    const body = appointmentBody({
      patientId: patient.id,
      professionalId: professional.id,
      date: futureWorkday(12),
      time: "09:00",
    });

    const created = await api<ApiAppointment>("/api/appointments", {
      method: "POST",
      body,
    });
    assert.equal(created.status, 201, created.error);
    assert.equal(created.data?.patientName, patient.nombre);

    const confirmed = await api<ApiAppointment>(`/api/appointments/${body.id}`, {
      method: "PATCH",
      body: { status: "confirmado" },
    });
    assert.equal(confirmed.status, 200, confirmed.error);
    assert.equal(confirmed.data?.status, "confirmado");

    const edited = await api<ApiAppointment>(`/api/appointments/${body.id}`, {
      method: "PATCH",
      body: {
        ...body,
        status: "confirmado",
        sessionType: "Rehabilitación",
        notes: "Actualizado",
      },
    });
    assert.equal(edited.status, 200, edited.error);
    assert.equal(edited.data?.sessionType, "Rehabilitación");
    assert.equal(edited.data?.notes, "Actualizado");

    const cancelled = await api<ApiAppointment>(`/api/appointments/${body.id}`, {
      method: "PATCH",
      body: { status: "cancelado" },
    });
    assert.equal(cancelled.status, 200, cancelled.error);
    assert.equal(cancelled.data?.status, "cancelado");
  });

  it("rechaza un turno solapado con el mismo profesional", async () => {
    const professional = await createProfessional();
    const [first, second] = [await createPatient(), await createPatient()];
    const slot = { professionalId: professional.id, date: futureWorkday(13), time: "10:00" };

    const created = await api("/api/appointments", {
      method: "POST",
      body: appointmentBody({ ...slot, patientId: first.id }),
    });
    assert.equal(created.status, 201, created.error);

    const overlap = await api("/api/appointments", {
      method: "POST",
      body: appointmentBody({ ...slot, patientId: second.id }),
    });
    // Choca con un recurso existente: 409, como DNI o matrícula duplicados.
    assert.equal(overlap.status, 409);
    assert.equal(overlap.error, APPOINTMENT_OVERLAP_ERROR);
    assert.equal(overlap.field, "overlap");
  });

  it("un slot cancelado se puede volver a agendar", async () => {
    const professional = await createProfessional();
    const patient = await createPatient();
    const slot = { professionalId: professional.id, date: futureWorkday(14), time: "11:00" };
    const first = appointmentBody({ ...slot, patientId: patient.id });

    assert.equal((await api("/api/appointments", { method: "POST", body: first })).status, 201);
    await api(`/api/appointments/${first.id}`, {
      method: "PATCH",
      body: { status: "cancelado" },
    });

    const again = await api("/api/appointments", {
      method: "POST",
      body: appointmentBody({ ...slot, patientId: patient.id }),
    });
    assert.equal(again.status, 201, again.error);
  });
});

describe("concurrencia", () => {
  /** Manda los POST en paralelo y devuelve los status ordenados. */
  async function racePosts(bodies: unknown[]): Promise<number[]> {
    const results = await Promise.all(
      bodies.map((body) => api("/api/appointments", { method: "POST", body }))
    );
    return results.map((result) => result.status).sort();
  }

  it("dos altas simultáneas en el mismo slot del profesional: una 201, otra 409", async () => {
    const professional = await createProfessional();
    const patients = [await createPatient(), await createPatient()];

    // Varias rondas para que una carrera real tenga chance de aparecer.
    for (let round = 0; round < 3; round++) {
      const slot = {
        professionalId: professional.id,
        date: futureWorkday(20 + round),
        time: "10:00",
      };
      const statuses = await racePosts(
        patients.map((patient) => appointmentBody({ ...slot, patientId: patient.id }))
      );
      assert.deepEqual(statuses, [201, 409], `ronda ${round}`);
    }
  });

  it("dos altas simultáneas del mismo paciente con profesionales distintos: una 201, otra 409 (M2)", async () => {
    const professionals = [await createProfessional(), await createProfessional()];
    const patient = await createPatient();

    for (let round = 0; round < 3; round++) {
      const date = futureWorkday(25 + round);
      const statuses = await racePosts(
        professionals.map((professional) =>
          appointmentBody({
            patientId: patient.id,
            professionalId: professional.id,
            date,
            time: "15:00",
          })
        )
      );
      assert.deepEqual(statuses, [201, 409], `ronda ${round}`);
    }
  });
});

describe("cambio de estado con la agenda del profesional modificada (A2)", () => {
  it("cancela un turno de un día que el profesional ya no atiende", async () => {
    const date = futureWorkday(15);
    const professional = await createProfessional({ diasAtencion: [weekdayName(date)] });
    const patient = await createPatient();
    const body = appointmentBody({
      patientId: patient.id,
      professionalId: professional.id,
      date,
      time: "10:00",
    });
    assert.equal((await api("/api/appointments", { method: "POST", body })).status, 201);

    // Se le saca ese día y se corre el horario: el turno queda fuera de agenda.
    await prisma.profesional.update({
      where: { id: professional.id },
      data: {
        diasAtencion: weekdayName(date) === "Lunes" ? ["Martes"] : ["Lunes"],
        horarioInicio: "08:30",
      },
    });

    const cancelled = await api<ApiAppointment>(`/api/appointments/${body.id}`, {
      method: "PATCH",
      body: { status: "cancelado" },
    });
    assert.equal(cancelled.status, 200, cancelled.error);
    assert.equal(cancelled.data?.status, "cancelado");
  });
});

describe("sincronización con pacientes", () => {
  it("último turno = último atendido pasado, aunque haya uno futuro (M6)", async () => {
    const professional = await createProfessional();
    const patient = await createPatient();
    await createAppointmentInDb({
      patient,
      professional,
      date: "05-01-2026",
      time: "10:00",
      status: "atendido",
    });
    await createAppointmentInDb({
      patient,
      professional,
      date: futureWorkday(16),
      time: "10:00",
      status: "pendiente",
    });

    const res = await api<{ lastAppointment?: string }>(`/api/patients/${patient.id}`);
    assert.equal(res.status, 200, res.error);
    assert.equal(res.data?.lastAppointment, "05-01-2026");
  });

  it("marcar atendido recalcula el último turno guardado", async () => {
    const professional = await createProfessional();
    const patient = await createPatient();
    const turno = await createAppointmentInDb({
      patient,
      professional,
      date: "10-02-2026",
      time: "10:00",
      status: "confirmado",
    });

    const res = await api(`/api/appointments/${turno.id}`, {
      method: "PATCH",
      body: { status: "atendido" },
    });
    assert.equal(res.status, 200, res.error);

    const stored = await prisma.paciente.findUniqueOrThrow({ where: { id: patient.id } });
    assert.equal(stored.ultimoTurno?.toISOString(), appDateToDb("10-02-2026").toISOString());
  });

  it("al renombrar un paciente, el nombre se propaga a sus turnos", async () => {
    const professional = await createProfessional();
    const patient = await createPatient();
    const turno = await createAppointmentInDb({
      patient,
      professional,
      date: futureWorkday(17),
      time: "12:00",
    });

    const renamed = await api(`/api/patients/${patient.id}`, {
      method: "PATCH",
      body: {
        firstName: "Nombre",
        lastName: "Nuevo",
        dni: patient.dni,
        phone: patient.telefono,
        email: "",
        insurance: "",
        status: "activo",
        notes: "",
      },
    });
    assert.equal(renamed.status, 200, renamed.error);

    const updated = await api<ApiAppointment>(`/api/appointments/${turno.id}`);
    assert.equal(updated.data?.patientName, "Nombre Nuevo");
  });
});
