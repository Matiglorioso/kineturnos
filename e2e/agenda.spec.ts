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

test.use({ storageState: storageStateFor("recepcionista") });
test.afterAll(cleanupTestData);

async function openNewAppointmentDialog(page: import("@playwright/test").Page) {
  await page.goto("/agenda");
  await page.getByRole("main").getByRole("button", { name: "Agendar turno" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Agendar turno" });
  await expect(dialog).toBeVisible();
  return dialog;
}

test.describe("agendar turnos (recepcionista, perfil Administrador)", () => {
  test("agenda un turno: los horarios ocupados no se pueden elegir y el turno aparece en la agenda", async ({ page }) => {
    const professional = await createProfessional(uniqueName("Prof"));
    const patient = await createPatient(uniqueName("Pac"));
    const other = await createPatient(uniqueName("Otro"));
    const date = futureWorkday(20);
    // 10:00 ya está ocupado para este profesional.
    await createAppointmentInDb({ patient: other, professional, date, time: "10:00" });

    const dialog = await openNewAppointmentDialog(page);
    // El paciente se busca escribiendo (por DNI o nombre), no en una lista de cientos.
    await dialog.getByRole("combobox", { name: "Paciente *" }).fill(patient.dni);
    await expect(page.getByRole("option")).toHaveCount(1);
    await page.getByRole("option", { name: patient.nombre }).click();
    await expect(dialog.getByRole("combobox", { name: "Paciente *" })).toHaveValue(patient.nombre);
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
    await dialog.getByRole("button", { name: "Agendar turno" }).click();

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
    await dialog.getByRole("button", { name: "Agendar turno" }).click();

    await expect(
      dialog.getByText("El paciente ya tiene otro turno en ese horario.").first()
    ).toBeVisible();
    await expect(dialog).toBeVisible();
  });

  test("confirma un turno pendiente con un toque desde la agenda", async ({ page }) => {
    const professional = await createProfessional(uniqueName("Prof"));
    const patient = await createPatient(uniqueName("Pac"));
    const date = futureWorkday(15);
    await createAppointmentInDb({ patient, professional, date, time: "10:00", status: "pendiente" });

    await page.goto("/agenda");
    await goToAgendaDate(page, date);
    const row = page.getByRole("row").filter({ hasText: patient.nombre });
    await row.getByRole("button", { name: `Confirmar turno: ${patient.nombre}` }).click();
    await expect(row).toContainText("Confirmado");
    // Ya confirmado y en el futuro: no queda acción rápida ni asistencia para registrar.
    await expect(row.getByRole("button", { name: /^(Confirmar turno|Marcar atendido):/ })).toHaveCount(0);
    await row.getByRole("button", { name: "Acciones del turno" }).click();
    await expect(page.getByRole("menuitem", { name: "Marcar como atendido" })).toHaveCount(0);
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

    // Estado final: no ofrece otros cambios de estado, pero sí eliminar.
    await openActions();
    await expect(page.getByRole("menuitem", { name: "Marcar como ausente" })).toBeDisabled();
    await expect(page.getByRole("menuitem", { name: "Cancelar turno" })).toHaveCount(0);
    await page.getByRole("menuitem", { name: "Eliminar turno" }).click();
    await page.getByRole("button", { name: "Sí, eliminar turno" }).click();
    await expect(page.getByText("Turno eliminado")).toBeVisible();
    await expect(row).toHaveCount(0);
  });
});

test.describe("día y filtros de la agenda", () => {
  test("la tira de días muestra cuántos turnos hay y el filtro por paciente se aplica y se quita", async ({ page }) => {
    const professional = await createProfessional(uniqueName("Prof"));
    const first = await createPatient(uniqueName("Uno"));
    const second = await createPatient(uniqueName("Dos"));
    const date = futureWorkday(26);
    await createAppointmentInDb({ patient: first, professional, date, time: "09:00" });
    await createAppointmentInDb({ patient: second, professional, date, time: "11:00" });

    await page.goto("/agenda");
    await goToAgendaDate(page, date);

    // El día elegido queda marcado en la tira, con la cantidad de turnos (de todos los profesionales).
    const day = page
      .getByRole("group", { name: /^Días de / })
      .getByRole("button", { pressed: true });
    await expect(day).toHaveAccessibleName(/\d+ turnos?$/);

    const rows = page.getByRole("row");
    await expect(rows.filter({ hasText: first.nombre })).toBeVisible();
    await expect(rows.filter({ hasText: second.nombre })).toBeVisible();

    const filters = page.getByRole("group", { name: "Filtros de la agenda" });
    await selectOption(filters, page, "Paciente", first.nombre);
    await expect(rows.filter({ hasText: first.nombre })).toBeVisible();
    await expect(rows.filter({ hasText: second.nombre })).toHaveCount(0);

    // El filtro activo queda marcado en el selector y se quita con la X.
    await expect(filters.getByRole("combobox", { name: "Paciente" })).toContainText(first.nombre);
    await filters.getByRole("button", { name: "Limpiar filtros" }).click();
    await expect(filters.getByRole("combobox", { name: "Paciente" })).toContainText("Todos los pacientes");
    await expect(rows.filter({ hasText: second.nombre })).toBeVisible();
  });
});

test.describe("vista por profesional (RF03)", () => {
  test("muestra el día de cada profesional y un horario libre abre el alta con profesional y hora", async ({ page }) => {
    const professional = await createProfessional(uniqueName("Col"));
    const patient = await createPatient(uniqueName("Col"));
    const date = futureWorkday(25);
    await createAppointmentInDb({ patient, professional, date, time: "10:00" });

    await page.goto("/agenda");
    await goToAgendaDate(page, date);
    // El día elegido se mantiene al cambiar de vista.
    await page.getByRole("group", { name: "Vista de la agenda" }).getByRole("button", { name: "Profesionales" }).click();

    const grid = page.getByRole("table", { name: "Turnos por profesional" });
    await expect(grid.getByRole("columnheader").filter({ hasText: professional.nombre })).toContainText(
      "1 turno · 9 libres"
    );

    await grid.getByRole("button", { name: new RegExp(`^10:00 · ${patient.nombre}`) }).click();
    await expect(page.getByRole("dialog").getByText(patient.nombre).first()).toBeVisible();
    await page.keyboard.press("Escape");

    await grid.getByRole("button", { name: `Agendar con ${professional.nombre} a las 11:00` }).click();
    const dialog = page.getByRole("dialog", { name: "Agendar turno" });
    await expect(dialog.getByRole("combobox", { name: "Profesional" })).toContainText(professional.nombre);
    await expect(dialog.getByRole("combobox", { name: "Horario" })).toContainText("11:00");
  });
});

