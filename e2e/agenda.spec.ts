import { expect, test } from "@playwright/test";
import {
  cleanupTestData,
  createAppointmentInDb,
  createPatient,
  createProfessional,
  futureWorkday,
  goToAgendaDate,
  selectOption,
  storageStateFor,
  uniqueName,
} from "./helpers";

test.use({ storageState: storageStateFor("recepcion") });
test.afterAll(cleanupTestData);

async function openNewAppointmentDialog(page: import("@playwright/test").Page) {
  await page.goto("/agenda");
  await page.getByRole("main").getByRole("button", { name: "Agendar turno" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Agendar turno" });
  await expect(dialog).toBeVisible();
  return dialog;
}

test.describe("agendar turnos (recepción)", () => {
  test("agenda un turno: los horarios ocupados no se pueden elegir y el turno aparece en la agenda", async ({ page }) => {
    const professional = await createProfessional(uniqueName("Prof"));
    const patient = await createPatient(uniqueName("Pac"));
    const other = await createPatient(uniqueName("Otro"));
    const date = futureWorkday(20);
    // 10:00 ya está ocupado para este profesional.
    await createAppointmentInDb({ patient: other, professional, date, time: "10:00" });

    const dialog = await openNewAppointmentDialog(page);
    await selectOption(dialog, page, "Paciente *", patient.nombre);
    await selectOption(dialog, page, "Profesional *", new RegExp(professional.nombre));
    await dialog.getByRole("textbox", { name: "Fecha *" }).fill(date);

    await dialog.getByRole("combobox", { name: "Horario *" }).click();
    const slots = page.getByRole("option");
    await expect(slots.filter({ hasText: "09:00 - 10:00 hs" })).toBeEnabled();
    // El ocupado se muestra, pero deshabilitado y marcado.
    const taken = slots.filter({ hasText: "10:00 - 11:00 hs" });
    await expect(taken).toContainText("Ocupado");
    await expect(taken).toBeDisabled();
    await slots.filter({ hasText: "09:00 - 10:00 hs" }).click();

    await selectOption(dialog, page, "Tipo de sesión *", "Control");
    await dialog.getByRole("button", { name: "Confirmar turno" }).click();

    await expect(page.getByText("Turno agendado")).toBeVisible();
    await expect(dialog).toBeHidden();

    await goToAgendaDate(page, date);
    const row = page.getByRole("row").filter({ hasText: patient.nombre });
    await expect(row).toBeVisible();
    await expect(row).toContainText("09:00");
  });

  test("no deja agendar al mismo paciente dos veces a la misma hora (M2)", async ({ page }) => {
    const [first, second] = [
      await createProfessional(uniqueName("ProfA")),
      await createProfessional(uniqueName("ProfB")),
    ];
    const patient = await createPatient(uniqueName("Pac"));
    const date = futureWorkday(21);
    await createAppointmentInDb({ patient, professional: first, date, time: "11:00" });

    const dialog = await openNewAppointmentDialog(page);
    await selectOption(dialog, page, "Paciente *", patient.nombre);
    await selectOption(dialog, page, "Profesional *", new RegExp(second.nombre));
    await dialog.getByRole("textbox", { name: "Fecha *" }).fill(date);
    await selectOption(dialog, page, "Horario *", "11:00 - 12:00 hs");
    await selectOption(dialog, page, "Tipo de sesión *", "Control");
    await dialog.getByRole("button", { name: "Confirmar turno" }).click();

    await expect(
      dialog.getByText("El paciente ya tiene otro turno en ese horario.").first()
    ).toBeVisible();
    await expect(dialog).toBeVisible();
  });

  test("confirmar, atender y recién ahí eliminar un turno", async ({ page }) => {
    const professional = await createProfessional(uniqueName("Prof"));
    const patient = await createPatient(uniqueName("Pac"));
    const date = futureWorkday(-7); // turno pasado: se puede marcar atendido
    await createAppointmentInDb({ patient, professional, date, time: "09:00", status: "pendiente" });

    await page.goto("/agenda");
    await goToAgendaDate(page, date);
    const row = page.getByRole("row").filter({ hasText: patient.nombre });
    await expect(row).toContainText("Pendiente");
    const openActions = async () => {
      await row.getByRole("button", { name: "Acciones del turno" }).click();
    };

    // Activo: no se puede eliminar.
    await openActions();
    await expect(page.getByRole("menuitem", { name: "Eliminar turno" })).toHaveCount(0);

    // Pendiente → Confirmado (desde Editar).
    await page.getByRole("menuitem", { name: "Editar" }).click();
    const dialog = page.getByRole("dialog");
    await selectOption(dialog, page, "Estado *", "Confirmado");
    await dialog.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByText("Turno actualizado")).toBeVisible();
    await expect(row).toContainText("Confirmado");

    // Confirmado → Atendido.
    await openActions();
    await page.getByRole("menuitem", { name: "Marcar como atendido" }).click();
    await expect(page.getByText("Sesión atendida")).toBeVisible();
    await expect(row).toContainText("Atendido");

    // Estado final: ahora sí se puede eliminar.
    await openActions();
    await page.getByRole("menuitem", { name: "Eliminar turno" }).click();
    await page.getByRole("button", { name: "Sí, eliminar turno" }).click();
    await expect(page.getByText("Turno eliminado")).toBeVisible();
    await expect(row).toHaveCount(0);
  });
});
