import { expect, test } from "@playwright/test";
import {
  cleanupTestData,
  createAppointmentInDb,
  createPatient,
  createProfessional,
  futureWorkday,
  storageStateFor,
  uniqueName,
} from "./helpers";

test.use({ storageState: storageStateFor("recepcionista") });
test.afterAll(cleanupTestData);

test.describe("profesionales (Administración)", () => {
  test("la tarjeta abre la ficha; los próximos turnos dicen qué paciente viene", async ({ page }) => {
    const name = uniqueName("Prof");
    const professional = await createProfessional({ nombrePila: name.nombrePila, apellido: name.apellido });
    const patient = await createPatient(uniqueName("Pac"));
    await createAppointmentInDb({ patient, professional, date: futureWorkday(15), time: "10:00" });

    await page.goto("/profesionales");
    // Toda la tarjeta abre la ficha (el nombre es el botón para el teclado).
    await page.getByRole("button", { name: `Ver detalle de ${professional.nombre}` }).click();
    const detail = page.getByRole("dialog", { name: professional.nombre });

    // Antes cada turno repetía el nombre del profesional en vez del paciente.
    await expect(detail.getByText(patient.nombre)).toBeVisible();
    // Sin resumen ni totales.
    await expect(detail.getByText("Turnos asignados")).toHaveCount(0);
    // Editar y Desactivar están en la ficha.
    await expect(detail.getByRole("button", { name: "Editar", exact: true })).toBeVisible();
    await expect(detail.getByRole("button", { name: "Desactivar", exact: true })).toBeVisible();
  });
});
