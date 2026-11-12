import { expect, test } from "@playwright/test";
import { createAppointmentLinkToken, getAppointmentLinkSecret } from "../src/lib/appointment-links";
import {
  cleanupTestData,
  createAppointmentInDb,
  createPatient,
  createProfessional,
  futureWorkday,
  prisma,
  uniqueName,
} from "./helpers";

// El paciente no tiene usuario: entra sin sesión, con el enlace firmado del correo.
test.use({ storageState: { cookies: [], origins: [] } });
test.afterAll(cleanupTestData);

async function linkFor(status: "pendiente" | "confirmado") {
  const professional = await createProfessional(uniqueName("ProfCorreo"));
  const patient = await createPatient(uniqueName("PacCorreo"));
  const date = futureWorkday(3);
  const appointment = await createAppointmentInDb({ patient, professional, date, time: "10:00", status });
  const secret = getAppointmentLinkSecret();
  if (!secret) throw new Error("Falta AUTH_SECRET para firmar el enlace.");
  const token = createAppointmentLinkToken({ appointmentId: appointment.id, date, time: "10:00" }, secret);
  return { appointment, professional, token };
}

test.describe("confirmar o cancelar el turno desde el correo (RF05)", () => {
  test("confirmar: un toque, sin iniciar sesión", async ({ page }) => {
    const { appointment, professional, token } = await linkFor("pendiente");
    await page.goto(`/turno/${token}/confirmar`);
    await expect(page.getByRole("heading", { name: "Turno confirmado" })).toBeVisible();
    await expect(page.getByText(new RegExp(`a las 10:00 h con ${professional.nombre} ha sido confirmado`))).toBeVisible();
    const saved = await prisma.turno.findUniqueOrThrow({ where: { id: appointment.id } });
    expect(saved.estado).toBe("confirmado");
  });

  test("cancelar: pide un paso más y después lo informa", async ({ page }) => {
    const { appointment, token } = await linkFor("confirmado");
    await page.goto(`/turno/${token}/cancelar`);
    await expect(page.getByRole("heading", { name: "¿Cancelás tu turno?" })).toBeVisible();
    // Abrir el enlace no cancela nada (los filtros de correo lo abren solos).
    expect((await prisma.turno.findUniqueOrThrow({ where: { id: appointment.id } })).estado).toBe("confirmado");

    await page.getByRole("button", { name: "Sí, cancelar mi turno" }).click();
    await expect(page.getByRole("heading", { name: "Turno cancelado" })).toBeVisible();
    expect((await prisma.turno.findUniqueOrThrow({ where: { id: appointment.id } })).estado).toBe("cancelado");
  });

  test("un enlace modificado no sirve", async ({ page }) => {
    const { token } = await linkFor("pendiente");
    await page.goto(`/turno/${token.slice(0, -2)}xx/confirmar`);
    await expect(page.getByRole("heading", { name: "Enlace no válido" })).toBeVisible();
  });
});
