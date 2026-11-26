import { expect, test } from "@playwright/test";
import {
  cleanupTestData,
  createAppointmentInDb,
  createPatient,
  createProfessional,
  futureWorkday,
  goToAgendaDate,
  storageStateFor,
  uniqueName,
} from "./helpers";

// Corre en el proyecto "mobile" (390 × 844).
test.use({ storageState: storageStateFor("recepcionista") });
test.afterAll(cleanupTestData);

test.describe("mobile (390 px)", () => {
  test("agenda: un turno por fila; al tocarlo, sus acciones salen desde abajo", async ({ page }) => {
    const professional = await createProfessional(uniqueName("Prof"));
    const patient = await createPatient(uniqueName("Pac"));
    const date = futureWorkday(23);
    await createAppointmentInDb({ patient, professional, date, time: "10:00" });

    await page.goto("/agenda");
    await goToAgendaDate(page, date);

    await expect(page.getByRole("table")).toBeHidden();
    // "Agendar turno" es el botón flotante.
    await expect(page.getByRole("button", { name: "Agendar turno" }).filter({ visible: true })).toBeVisible();

    await page.getByRole("button", { name: `10:00 · ${patient.nombre}` }).click();
    const sheet = page.getByRole("dialog", { name: `${patient.nombre} · 10:00` });
    await expect(sheet.getByRole("button", { name: "Confirmar" })).toBeVisible();
    await expect(sheet.getByRole("button", { name: "Cancelar turno" })).toBeVisible();
    await expect(sheet.getByRole("button", { name: "Reprogramar" })).toBeVisible();

    await sheet.getByRole("link", { name: "Ficha del paciente" }).click();
    await expect(page.getByRole("dialog", { name: patient.nombre })).toBeVisible();
  });

  test("barra de navegación abajo: Hoy, Agenda, Pacientes y Más (el resto del menú)", async ({ page }) => {
    await page.goto("/");
    const tabs = page.getByRole("navigation", { name: "Navegación principal" });
    await expect(tabs.getByRole("link", { name: "Hoy" })).toHaveAttribute("aria-current", "page");
    // Ya no hay menú hamburguesa arriba.
    await expect(page.getByRole("button", { name: "Abrir menú" })).toHaveCount(0);

    await tabs.getByRole("link", { name: "Agenda" }).click();
    await expect(page).toHaveURL("/agenda");
    await expect(tabs.getByRole("link", { name: "Agenda" })).toHaveAttribute("aria-current", "page");

    // "Más" es una pantalla con el resto de las secciones.
    await tabs.getByRole("link", { name: "Más" }).click();
    await expect(page).toHaveURL("/mas");
    await expect(tabs.getByRole("link", { name: "Más" })).toHaveAttribute("aria-current", "page");
    await page.getByRole("navigation", { name: "Secciones" }).getByRole("link", { name: "Profesionales" }).click();
    await expect(page).toHaveURL("/profesionales");
    // En las secciones que se abren desde "Más", queda marcado "Más".
    await expect(tabs.getByRole("link", { name: "Más" })).toHaveAttribute("aria-current", "page");
  });

  test("Hoy: lo del día primero; los indicadores quedan para la computadora", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("region", { name: "Para hacer" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Indicadores" })).toBeHidden();
    await expect(page.getByRole("navigation", { name: "Atajos" })).toBeHidden();
  });

  test("pacientes en filas; la ficha a pantalla completa con pestañas", async ({ page }) => {
    const patient = await createPatient(uniqueName("Fic"));
    await page.goto("/pacientes");
    // "Nuevo paciente" es el botón flotante; los filtros, detrás de un botón.
    await expect(page.getByRole("button", { name: "Nuevo paciente" }).filter({ visible: true })).toBeVisible();
    await page.getByRole("textbox", { name: "Buscar pacientes" }).fill(patient.dni);
    await page.getByRole("button", { name: `Ver detalle de ${patient.nombre}` }).filter({ visible: true }).click();

    const ficha = page.getByRole("dialog", { name: patient.nombre });
    const tabs = ficha.getByRole("tablist", { name: "Secciones de la ficha" });
    await expect(tabs.getByRole("tab", { name: "Datos" })).toHaveAttribute("aria-selected", "true");
    await expect(ficha.getByText(patient.dni)).toBeVisible();
    await tabs.getByRole("tab", { name: "Turnos" }).click();
    await expect(ficha.getByRole("region", { name: "Próximos" })).toBeVisible();
    // Editar, desactivar y eliminar quedan en "⋯".
    await ficha.getByRole("button", { name: "Más acciones" }).click();
    await expect(page.getByRole("menuitem", { name: "Editar paciente" })).toBeVisible();
  });

  test("usuarios en filas (acciones desde abajo) y la cuenta en \"Más\" con cambio de contraseña", async ({ page }) => {
    await page.goto("/usuarios");
    await expect(page.getByRole("table")).toBeHidden();
    const rows = page.getByRole("list", { name: "Usuarios" });
    await rows.getByRole("button", { name: /^Usuario / }).first().click();
    await expect(page.getByRole("button", { name: "Editar usuario" })).toBeVisible();
    await page.keyboard.press("Escape");

    // En el celular no hay barra de arriba: la cuenta está en "Más".
    await page.getByRole("navigation", { name: "Navegación principal" }).getByRole("link", { name: "Más" }).click();
    await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
    await page.getByRole("link", { name: "Cambiar contraseña" }).click();
    await expect(page).toHaveURL("/cambiar-contrasena");
    await expect(page.getByRole("heading", { name: "Cambiar contraseña" })).toBeVisible();
  });

  test("agenda por profesional: un profesional a la vez, elegido arriba", async ({ page }) => {
    const professional = await createProfessional(uniqueName("Movil"));
    const patient = await createPatient(uniqueName("Movil"));
    const date = futureWorkday(26);
    await createAppointmentInDb({ patient, professional, date, time: "09:00" });

    await page.goto("/agenda");
    await goToAgendaDate(page, date);
    // El día elegido se mantiene al cambiar de vista.
    await page.getByRole("group", { name: "Vista de la agenda" }).getByRole("button", { name: "Profesionales" }).click();

    await expect(page.getByRole("table", { name: "Turnos por profesional" })).toBeHidden();
    // Fila de profesionales que se desliza; un horario por renglón.
    const tabs = page.getByRole("tablist", { name: "Profesionales del día" });
    await tabs.getByRole("tab", { name: professional.nombre }).click();
    const panel = page.getByRole("list", { name: `Horarios de ${professional.nombre}` });
    await expect(panel.getByRole("button", { name: new RegExp(`^09:00 · ${patient.nombre}`) })).toBeVisible();
    await expect(panel.getByRole("button", { name: `Agendar con ${professional.nombre} a las 10:00` })).toBeVisible();
  });

  test("formularios: pantalla completa con Volver y la acción abajo", async ({ page }) => {
    await page.goto("/pacientes?nuevo=1");
    const dialog = page.getByRole("dialog", { name: "Nuevo paciente" });
    await expect(dialog.getByRole("button", { name: "Volver" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Cancelar" })).toBeHidden();
    await expect(dialog.getByRole("button", { name: "Registrar paciente" })).toBeInViewport();
    await dialog.getByRole("button", { name: "Volver" }).click();
    await expect(dialog).toBeHidden();
  });

  test("profesionales: una fila por profesional; la ficha con sus acciones en ⋯", async ({ page }) => {
    const professional = await createProfessional(uniqueName("Movil"));
    await page.goto("/profesionales");
    await page.getByRole("button", { name: `Ver detalle de ${professional.nombre}` }).filter({ visible: true }).click();
    const dialog = page.getByRole("dialog", { name: professional.nombre });
    await dialog.getByRole("button", { name: "Más acciones" }).click();
    await expect(page.getByRole("menuitem", { name: "Editar profesional" })).toBeVisible();
    await page.keyboard.press("Escape");
    await dialog.getByRole("button", { name: "Profesionales" }).click();
    await expect(dialog).toBeHidden();
  });
});

