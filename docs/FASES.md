# Fases de implementación

Estado final de las fases planificadas en la tesis, con lo que se entregó en cada una y su evidencia (pull requests en GitHub). El texto de la sección "Texto para la tesis" está listo para reemplazar el apartado *Fases de implementación* del informe.

## Texto para la tesis

**Fases de implementación:** el sistema se desarrolló con un enfoque incremental. Cada fase entregó una versión operativa, publicada en producción, que suma funcionalidades a la anterior. El orden respondió a las prioridades del consultorio: primero se digitalizó el proceso central de turnos, que se gestionaba en papel y por WhatsApp, y luego se incorporaron los módulos clínico, administrativo y de comunicación con los pacientes. Cada cambio se integró con pruebas automáticas (unitarias, de integración contra la base de datos y de punta a punta en el navegador) que se ejecutan en cada versión antes de publicarla.

**Fase 1 – Núcleo operativo (implementada, agosto a septiembre de 2026):**
- seguridad y accesos: inicio y cierre de sesión, perfiles Administrador y Profesional, y el nivel técnico Superadmin;
- gestión de turnos y agenda: crear, reprogramar, cancelar, registrar asistencia, eliminar y consultar turnos, con validación de disponibilidad y de solapamientos;
- gestión de pacientes y de profesionales;
- un panel inicial con las métricas del día.

Requerimientos: RF01 a RF04, RF06, RF08 a RF10, RF18 y RF19.

**Fase 2 – Historia clínica digital (implementada, octubre de 2026):**
- registro por sesión de la evolución, el diagnóstico y el plan de tratamiento;
- alertas clínicas, antecedentes y objetivos del tratamiento;
- consulta del historial completo y vista de impresión;
- acceso restringido según el perfil, y registro de cada lectura y modificación.

Requerimientos: RF11 a RF13, RNF06 y RNF07.

**Fase 3 – Gestión de obras sociales (implementada, octubre de 2026):**
- catálogo de obras sociales;
- datos de afiliación de cada paciente;
- autorizaciones con cantidad de sesiones y vencimiento, que descuentan sesiones al registrar la asistencia y avisan cuando una autorización está vencida, agotada o por renovar;
- planilla mensual de asistencia por obra social, para la facturación.

Requerimientos: RF07, RF14 y RF15.

**Fase 4 – Notificaciones (implementada, septiembre de 2026):**
- envío automático de correos al paciente ante la creación, confirmación, reprogramación o cancelación de un turno;
- recordatorio 24 horas antes de cada turno.

Requerimiento: RF05.

**Fase 5 – Dashboard de indicadores (implementada, octubre de 2026):**
- turnos por profesional, tasas de cancelación y de ausentismo, y pacientes y sesiones atendidas por período, comparados con el período anterior;
- accesos directos a las secciones más utilizadas;
- lista de tareas del día, para registrar asistencia y confirmar turnos sin salir del panel.

Requerimientos: RF16 y RF17.

**Cierre – Ajustes y requisitos no funcionales (octubre de 2026):**
- gestión de usuarios desde el sistema, con contraseña temporal y cambio obligatorio;
- CUIL y fecha de nacimiento del paciente, con búsqueda por CUIL (RF08);
- vista de la agenda por profesional (RF03);
- medición del rendimiento con el volumen real de operación (RNF03 y RNF04);
- monitoreo continuo de la disponibilidad (RNF08).

Las fases 2 y 4 se implementaron en orden inverso al planificado: las notificaciones quedaron operativas antes que la historia clínica.

## Detalle y evidencia

| Fase | Entregas (pull requests) | Fecha |
|---|---|---|
| 1 – Núcleo operativo | #1 permisos por perfil y menú · #2 agenda y validaciones de turnos · #3 rate limit de login y reagendado · #4 fechas y horas en PostgreSQL · #8 turnos de 1 hora con el horario del consultorio · #12 máquina de estados del turno · #13 identidad SANMAR SALUD · #14 perfiles Administrador, Profesional y Superadmin | 01-08 a 25-09-2026 |
| Calidad de la Fase 1 | #5 a #7, #9 y #11: plan de pruebas (unitarias, regresión, integración, E2E y cobertura) y corrección de los hallazgos de la revisión de código. Ver [TESTING.md](TESTING.md) | 25-09-2026 |
| 4 – Notificaciones | #15 correos al paciente (RF05) · #16 recordatorio sin duplicados. Ver [NOTIFICACIONES.md](NOTIFICACIONES.md) | 28-09-2026 |
| 2 – Historia clínica | #17 historia clínica digital (RF11 a RF13) | 01-10-2026 |
| Mejoras de uso | #18 agenda con tira de días, calendario y filtros · #19 pacientes ordenados y filtrados por obra social | 02-10-2026 |
| 3 – Obras sociales | #20 catálogo, autorizaciones y planilla mensual (RF07, RF14, RF15) | 19-10-2026 |
| 5 – Indicadores | #21 panel con accesos rápidos, tareas del día e indicadores (RF16, RF17) | 19-10-2026 |
| Cierre | #22 CUIL y fecha de nacimiento · #23 gestión de usuarios · #24 búsqueda por CUIL y monitoreo de disponibilidad · #25 agenda por profesional · #26 rendimiento. Ver [RENDIMIENTO.md](RENDIMIENTO.md) y [DISPONIBILIDAD.md](DISPONIBILIDAD.md) | 26-10-2026 |

## Requerimientos cubiertos

| Requerimiento | Fase | Estado |
|---|---|---|
| RF01 a RF04 – Turnos, disponibilidad, agenda (día, semana, profesional) y filtros | 1 y cierre | ✅ |
| RF05 – Notificaciones por correo | 4 | ✅ |
| RF06 – Datos de pacientes | 1 | ✅ |
| RF07 – Obra social del paciente | 3 | ✅ |
| RF08 – Búsqueda por nombre, DNI o CUIL | 1 y cierre | ✅ |
| RF09, RF10 – Profesionales y agenda propia | 1 | ✅ |
| RF11 a RF13 – Historia clínica | 2 | ✅ |
| RF14, RF15 – Autorizaciones | 3 | ✅ |
| RF16, RF17 – Indicadores y accesos directos | 5 | ✅ |
| RF18, RF19 – Autenticación y acceso por perfil | 1 | ✅ |
| RNF01, RNF02 – Uso sencillo y responsive | Todas | ✅ (pruebas E2E en 390 px) |
| RNF03, RNF04 – Tiempo de respuesta y volumen | Cierre | ✅ Medido ([RENDIMIENTO.md](RENDIMIENTO.md)) |
| RNF05 – Contraseñas cifradas | 1 | ✅ bcrypt |
| RNF06, RNF07 – Privacidad y trazabilidad clínica | 2 | ✅ |
| RNF08 – Disponibilidad 24 h | Cierre | ✅ Monitoreo cada 15 min ([DISPONIBILIDAD.md](DISPONIBILIDAD.md)) |
| RNF09 – Respaldo periódico de la base | — | ⚠️ Lo da Neon (historial de restauración); falta un respaldo propio programado |
| RNF10 – Chrome y Edge | Todas | ✅ (pruebas E2E en Chromium) |
| RNF11, RNF12 – Arquitectura modular y código mantenible | Todas | ✅ |
| RNF13 – Nivel técnico Superadmin | 1 | ✅ |
