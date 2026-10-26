import { expect, test } from "@playwright/test";
import { getTodayAppDate } from "../src/lib/date-utils";
import {
  cleanupTestData,
  createAppointmentInDb,
  createPatient,
  createProfessional,
  prisma,
  selectOption,
  storageStateFor,
  uniqueName,
} from "./helpers";

test.use({ storageState: storageStateFor("recepcionista") });
test.afterAll(cleanupTestData);

function testInsuranceName() {
  return `it-OS ${Date.now().toString(36)}`;
}

test.describe("obras sociales y autorizaciones (RF07, RF14, RF15)", () => {
  test("alta en el catálogo, obra social del paciente y autorización con sesiones", async ({ page }) => {
    const name = testInsuranceName();
    const patient = await createPatient(uniqueName("Os"));

    // Catálogo.
    await page.goto("/obras-sociales");
    await page.getByRole("tab", { name: "Catálogo" }).click();
    await page.getByRole("button", { name: "Nueva obra social" }).click();
    const insuranceDialog = page.getByRole("dialog", { name: "Nueva obra social" });
    await insuranceDialog.getByRole("textbox", { name: "Nombre *" }).fill(name);
    await insuranceDialog.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByRole("row").filter({ hasText: name })).toBeVisible();

    // Ficha del paciente: obra social del catálogo y número de afiliado.
    await page.goto("/pacientes");
    await page.getByPlaceholder("Buscar por nombre, DNI, CUIL, teléfono u obra social…").fill(patient.dni);
    await page.getByRole("button", { name: "Ver detalle" }).filter({ visible: true }).first().click();
    const detail = page.getByRole("dialog", { name: patient.nombre });
    await detail.getByRole("button", { name: "Editar paciente" }).click();
    const form = page.getByRole("dialog", { name: "Editar paciente" });
    await selectOption(form, page, "Obra social / prepaga", name);
    await form.getByRole("textbox", { name: "Nº de afiliado" }).fill("998877/02");
    await form.getByRole("button", { name: /Guardar/ }).click();
    await expect(form).toBeHidden();

    // Sin autorización, la lista avisa.
    const row = page.getByRole("row").filter({ hasText: patient.nombre });
    await expect(row).toContainText(name);
    await expect(row).toContainText("Sin autorización");

    // Autorización desde la ficha.
    await row.getByRole("button", { name: "Ver detalle" }).click();
    const coverage = page.getByRole("dialog", { name: patient.nombre }).getByRole("region", { name: "Cobertura" });
    await expect(coverage).toContainText("Afiliado Nº 998877/02");
    await coverage.getByRole("button", { name: "Nueva autorización" }).click();
    const authorization = page.getByRole("dialog", { name: "Nueva autorización" });
    await authorization.getByRole("textbox", { name: "Nº de autorización" }).fill("A-777");
    await authorization.getByRole("spinbutton", { name: "Sesiones *" }).fill("8");
    await authorization.getByRole("button", { name: "Guardar autorización" }).click();
    await expect(authorization).toBeHidden();
    await expect(coverage).toContainText("Nº A-777");
    await expect(coverage).toContainText("8 de 8 sesiones disponibles");
    await expect(coverage).toContainText("0 de 8 sesiones");
  });

  test("al agendar avisa si el paciente no tiene autorización vigente (sin bloquear)", async ({ page }) => {
    const name = testInsuranceName();
    const insurance = await prisma.obraSocial.create({
      data: { id: `it-os-${Date.now()}`, nombre: name, nombreNormalizado: name.toLowerCase() },
    });
    const patient = await createPatient(uniqueName("Aviso"));
    await prisma.paciente.update({
      where: { id: patient.id },
      data: { obraSocialId: insurance.id, obraSocial: insurance.nombre },
    });

    await page.goto("/agenda");
    await page.getByRole("main").getByRole("button", { name: "Agendar turno" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Agendar turno" });
    await selectOption(dialog, page, "Paciente *", patient.nombre);
    await expect(dialog.getByRole("status")).toContainText("Sin autorización cargada");
    await expect(dialog.getByRole("status")).toContainText("podés agendar igual");
  });

  test("la planilla mensual lista las sesiones atendidas con su autorización", async ({ page }) => {
    const name = testInsuranceName();
    const insurance = await prisma.obraSocial.create({
      data: { id: `it-os-${Date.now()}`, nombre: name, nombreNormalizado: name.toLowerCase() },
    });
    const patient = await createPatient(uniqueName("Planilla"));
    await prisma.paciente.update({
      where: { id: patient.id },
      data: { obraSocialId: insurance.id, obraSocial: insurance.nombre, nroAfiliado: "55/1" },
    });
    const today = getTodayAppDate();
    const [day, month, year] = today.split("-").map(Number);
    const authorization = await prisma.autorizacion.create({
      data: {
        id: `it-aut-${Date.now()}`,
        pacienteId: patient.id,
        obraSocialId: insurance.id,
        numero: "P-1",
        estado: "aprobada",
        sesiones: 10,
        fechaDesde: new Date(Date.UTC(year, month - 1, 1)),
        creadoPorNombre: "Test",
      },
    });
    const professional = await createProfessional(uniqueName("Prof"));
    const turno = await createAppointmentInDb({
      patient,
      professional,
      date: today,
      time: "08:00",
      status: "atendido",
    });
    await prisma.turno.update({ where: { id: turno.id }, data: { autorizacionId: authorization.id } });

    await page.goto("/obras-sociales");
    await page.getByRole("tab", { name: "Planilla mensual" }).click();
    await selectOption(page, page, "Obra social", name);
    await page.getByLabel("Mes").fill(`${year}-${String(month).padStart(2, "0")}`);

    const report = page.getByRole("region", { name: "Planilla de asistencia" });
    const reportRow = report.getByRole("row").filter({ hasText: patient.nombre });
    await expect(reportRow).toContainText("55/1");
    await expect(reportRow).toContainText("P-1");
    await expect(reportRow).toContainText(`${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}`);
  });

  test("la pestaña Autorizaciones busca, filtra y abre la edición", async ({ page }) => {
    const name = testInsuranceName();
    const insurance = await prisma.obraSocial.create({
      data: { id: `it-os-${Date.now()}`, nombre: name, nombreNormalizado: name.toLowerCase() },
    });
    const patients = [await createPatient(uniqueName("AutA")), await createPatient(uniqueName("AutB"))];
    for (const [index, patient] of patients.entries()) {
      await prisma.paciente.update({
        where: { id: patient.id },
        data: { obraSocialId: insurance.id, obraSocial: insurance.nombre },
      });
      await prisma.autorizacion.create({
        data: {
          id: `it-aut-${Date.now()}-${index}`,
          pacienteId: patient.id,
          obraSocialId: insurance.id,
          numero: `Z-${index}`,
          estado: index === 0 ? "pendiente" : "aprobada",
          sesiones: 10,
          fechaDesde: new Date(),
          creadoPorNombre: "Test",
        },
      });
    }

    await page.goto("/obras-sociales");
    await expect(page.getByRole("tab", { name: "Autorizaciones" })).toHaveAttribute("aria-selected", "true");
    const filters = page.getByRole("group", { name: "Filtros de autorizaciones" });
    await selectOption(filters, page, "Obra social", name);
    const rows = page.getByRole("table").getByRole("row").filter({ hasText: name });
    await expect(rows).toHaveCount(2);

    await selectOption(filters, page, "Situación", "En trámite");
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText(patients[0].nombre);

    await filters.getByRole("button", { name: "Limpiar filtros" }).click();
    await page.getByRole("textbox", { name: "Buscar autorizaciones" }).fill("Z-1");
    await expect(page.getByRole("table").getByRole("row").filter({ hasText: "Z-1" })).toHaveCount(1);

    await page.getByRole("button", { name: `Editar autorización de ${patients[1].nombre}` }).click();
    await expect(page.getByRole("dialog", { name: "Editar autorización" })).toBeVisible();
  });
});

