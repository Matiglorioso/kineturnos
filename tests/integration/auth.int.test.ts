import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import {
  ANON,
  api,
  appointmentBody,
  cleanupTestData,
  createAppointmentInDb,
  createPatient,
  createProfessional,
  createUser,
  futureWorkday,
  login,
  prisma,
  testId,
  uniqueDigits,
  type Auth,
} from "./helpers";

after(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

describe("autenticación de la API", () => {
  it("sin sesión responde 401", async () => {
    const res = await api("/api/patients", { auth: ANON });
    assert.equal(res.status, 401);
  });

  it("con contraseña incorrecta no hay sesión", async () => {
    await assert.rejects(login("recepcion@kineturnos.local", "incorrecta-123"));
  });

  for (const email of [
    "superadmin@kineturnos.local",
    "admin@kineturnos.local",
    "recepcion@kineturnos.local", // recepcionista: perfil Administrador
    "profe@kineturnos.local",
  ]) {
    it(`${email} inicia sesión y lee pacientes`, async () => {
      const session = await login(email);
      const res = await api<unknown[]>("/api/patients", { auth: session });
      assert.equal(res.status, 200, res.error);
    });
  }
});

describe("sesión con el usuario modificado (A3)", () => {
  it("un usuario desactivado con sesión abierta recibe 401 en la siguiente llamada", async () => {
    const user = await createUser({ rol: "admin" });
    const session = await login(user.email);
    assert.equal((await api("/api/patients", { auth: session })).status, 200);

    await prisma.usuario.update({ where: { id: user.id }, data: { activo: false } });

    const res = await api("/api/patients", { auth: session });
    assert.equal(res.status, 401);
  });

  it("un cambio de rol se aplica sin volver a loguearse", async () => {
    const user = await createUser({ rol: "admin" });
    const session = await login(user.email);
    const patient = await createPatient();

    await prisma.usuario.update({ where: { id: user.id }, data: { rol: "profesional" } });

    // Como profesional (sin ficha vinculada) ya no puede borrar pacientes.
    const res = await api(`/api/patients/${patient.id}`, {
      method: "DELETE",
      auth: session,
    });
    assert.equal(res.status, 403);
  });

  it("un usuario borrado recibe 401", async () => {
    const user = await createUser({ rol: "admin" });
    const session = await login(user.email);

    await prisma.usuario.delete({ where: { id: user.id } });

    assert.equal((await api("/api/patients", { auth: session })).status, 401);
  });
});

describe("permisos por rol", () => {
  it("el profesional no puede crear profesionales (403)", async () => {
    const session = await login("profe@kineturnos.local");
    const res = await api("/api/professionals", {
      method: "POST",
      auth: session,
      body: { firstName: "No", lastName: "Permitido" },
    });
    assert.equal(res.status, 403);
  });

  it("la recepcionista, con perfil Administrador, sí gestiona profesionales (201)", async () => {
    const session = await login("recepcion@kineturnos.local");
    const res = await api("/api/professionals", {
      method: "POST",
      auth: session,
      body: {
        id: testId("prof"),
        firstName: "Alta",
        lastName: "Recepcion",
        license: `MN ${uniqueDigits(6)}`,
        specialty: "RPG",
        days: ["Lunes"],
        active: true,
      },
    });
    assert.equal(res.status, 201, res.error);
  });
});

describe("scope del rol profesional", () => {
  let session: Auth;
  let ownProfessionalId: string;
  let otherTurnoId: string;

  before(async () => {
    const user = await prisma.usuario.findUniqueOrThrow({ where: { id: "u-profe" } });
    assert.ok(user.profesionalId, "el seed vincula u-profe a un profesional");
    ownProfessionalId = user.profesionalId;

    const other = await createProfessional();
    const patient = await createPatient();
    otherTurnoId = (
      await createAppointmentInDb({
        patient,
        professional: other,
        date: futureWorkday(18),
        time: "10:00",
      })
    ).id;

    session = await login("profe@kineturnos.local");
  });

  it("solo ve sus propios turnos", async () => {
    const res = await api<{ professionalId: string }[]>("/api/appointments", {
      auth: session,
    });
    assert.equal(res.status, 200, res.error);
    for (const appointment of res.data ?? []) {
      assert.equal(appointment.professionalId, ownProfessionalId);
    }
  });

  it("no puede leer ni cambiar el estado de un turno ajeno (403)", async () => {
    const read = await api(`/api/appointments/${otherTurnoId}`, { auth: session });
    assert.equal(read.status, 403);

    const patch = await api(`/api/appointments/${otherTurnoId}`, {
      method: "PATCH",
      auth: session,
      body: { status: "cancelado" },
    });
    assert.equal(patch.status, 403);
  });

  it("no puede crear turnos (403)", async () => {
    const patient = await createPatient();
    const res = await api("/api/appointments", {
      method: "POST",
      auth: session,
      body: appointmentBody({
        patientId: patient.id,
        professionalId: ownProfessionalId,
        date: futureWorkday(19),
        time: "10:00",
      }),
    });
    assert.equal(res.status, 403);
  });
});
