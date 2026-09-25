# Pruebas: estrategia y resultados

Resultados del plan de testing de KineTurnos, ejecutado sobre el commit `41b9cb9` (situación de partida) a partir del reporte de revisión de código del 24-09-2026. Cada hallazgo se trabajó con TDD: un commit con el test que falla ("Test en rojo") y otro con el arreglo ("Fix"), en PRs separados por paso del plan.

## 1. Resumen

| | Antes (`41b9cb9`) | Después |
|---|---|---|
| Tests unitarios | 22 (2 archivos) | 253 + 1 pendiente (17 archivos) |
| Tests de integración (DB + API) | Script propio con ~25 chequeos, sin framework | 44 tests con `node:test` (6 archivos) |
| Tests E2E (UI) | 0 | 17 con Playwright (desktop y mobile 390 px) |
| Cobertura de líneas: lógica de dominio (`src/lib`, 35 archivos) | 24,5 % | **98,1 %** |
| Cobertura de líneas: todo `src/lib` | 14,5 % | 58,9 % |
| Cobertura de ramas / funciones (`src/lib`) | 65,5 % / 47,6 % | 88,8 % / 89,5 % |
| Jobs de CI | lint, unit, build, verify | + E2E (Playwright) |
| Hallazgos del reporte corregidos | — | 13 de 22 (los 4 de severidad alta, M1–M7, B1 y B9); ver §4 |
| Casos de regresión del reporte automatizados | 0 de 8 | 8 de 8 |

Objetivos del plan: ≥ 80 % de líneas en la lógica de `src/lib` ✅ (98,1 %); los 8 casos de regresión automatizados ✅; E2E de los 7 flujos críticos ✅ (el del Dashboard quedó cubierto por la agenda, ver §6).

## 2. Estrategia: pirámide de tests

| Nivel | Qué prueba | Herramientas | Dónde | Comando |
|---|---|---|---|---|
| Unitario | Lógica pura de `src/lib`: validaciones, fechas y zona horaria, slots, permisos, parsers de la API, mapeo de errores a HTTP, calendario semanal, métricas | `node:test` + `tsx`, `c8` para cobertura | `src/lib/**/*.test.ts` | `npm test`, `npm run test:coverage` |
| Integración | API real contra Postgres: CRUD, 409 por duplicados y solapamientos, concurrencia, sesión y permisos por rol con login real, sincronización, seeds y scripts destructivos (en una base descartable) | `node:test`, `fetch`, Prisma | `tests/integration/*.int.test.ts` | `npm run test:int` |
| E2E | Flujos de usuario en Chromium: login, agendar, estados, permisos, mobile | Playwright | `e2e/*.spec.ts` | `npm run test:e2e` |

Decisiones:
- **Sin frameworks nuevos para unit/integración:** `node:test` + `tsx`, que ya usaba el proyecto.
- **"Ahora" inyectable** (`now`) en las funciones de fecha, y `TZ=UTC` en el test de zona horaria para reproducir el servidor de Vercel sin mockear el reloj.
- **Datos de prueba con prefijo `it-`**, creados y borrados por cada archivo; los scripts destructivos corren en una base creada para el test (`withScratchDatabase`).
- **CI con Postgres efímero** (servicio de GitHub Actions) para integración y E2E; nunca contra la base de producción.

## 3. Cobertura

Se mide con `npm run test:coverage` (c8 sobre la cobertura V8 de Node, con `--all` para que los archivos sin tests cuenten como 0 %). Solo registra lo que ejecutan los **tests unitarios**, por eso se informa por capa:

| Capa de `src/lib` | Archivos | Antes | Después | Qué la prueba |
|---|---|---|---|---|
| Lógica de dominio | 35 | 24,5 % | **98,1 %** | Unitarios |
| Acceso a datos (Prisma) | 10 | 0 % | 0 %* | Integración (44 tests) |
| Sesión y login del servidor | 4 | 0 % | 0 %* | Integración y E2E |
| Clientes HTTP y toasts (navegador) | 6 | 0 % | 3,6 %* | E2E (17 tests) |
| Contenido estático (textos, configuración) | 2 | 0 % | 0 % | No aplica |

\* Esas capas corren dentro del servidor de Next (`next dev`) o del navegador, en otro proceso, así que la herramienta no registra su ejecución. Su cobertura se mide por casos (§4 y §5), no por líneas.

Números antes/después obtenidos con la misma configuración sobre `41b9cb9` y sobre la rama del paso 5.

## 4. Matriz de trazabilidad: hallazgo → test → arreglo

Commits en formato rojo → verde. PR: #5 unitarios (paso 1), #6 regresión (paso 2), #7 integración (paso 3), #8 turnos de 1 hora, #9 E2E (paso 4).

| Hallazgo | Test | Rojo → Fix | PR | Resultado |
|---|---|---|---|---|
| **A1** Seeds borran una base con datos | `scripts.int.test.ts` (base descartable) | `3cdc622` → `66ce363` | #7 | ✅ Abortan salvo `--force`; el seed mínimo ya no borra |
| **A2** Cambiar estado revalida la agenda | `appointment-validation.test.ts`, `appointments.int.test.ts` | `c207d8a` → `a52cddb` | #6, #7 | ✅ |
| **A2** (edición completa) | `appointment-validation.test.ts` | `add1a1e` → `0afc13b` | #7 | ✅ |
| **A3** Usuario desactivado conserva la sesión | `auth.int.test.ts` | `b159e22` → `adc843a` | #7 | ✅ 401 en la siguiente llamada; el rol sale de la base |
| **A4** Open redirect en el login | `safe-callback-url.test.ts`, `e2e/auth.spec.ts` | `39c0a5f` → `681dfbc` | #6, #9 | ✅ |
| **M1** "Hoy" con la zona horaria del servidor | `date-utils.test.ts` (TZ=UTC) | `874b0f6` → `31cdc0c` | #6 | ✅ |
| **M2** Paciente con dos turnos a la vez | `appointment-validation.test.ts`, `appointments.int.test.ts` (concurrencia), `e2e/agenda.spec.ts` | `fec6a08` → `1b56256`; concurrencia `61974d7` → `e0438e7` | #6, #7, #9 | ✅ Validación + advisory locks por paciente y profesional |
| **M3** Turnos para hoy en horarios pasados | `appointment-validation.test.ts`; UI en `appointment-slots.test.ts` | `e2ad353` → `cdec759`; UI `2d35752` → `66f245f` | #6, #7 | ✅ |
| **M4** Borrar paciente con turnos activos | `patients.int.test.ts` | `be6fa12` → `9f9b0c5` | #7 | ✅ Bloqueado (409). Pendiente de decisión: borrado solo para admin / baja lógica |
| **M5** `purge-demo` pisa `ultimo_turno` | `scripts.int.test.ts` | `3cdc622` → `ddad2ad` | #7 | ✅ |
| **M6** "Último turno" mal calculado | `patient-appointments.test.ts`, `appointments.int.test.ts` | `b6fb182` → `620b04e` | #6 | ✅ |
| **M7** Validación incompleta en la API | `parse-*-body.test.ts` | `6c5f5a4` → `0485c9a` | #6 | ✅ 400 con `field` |
| **M8** Turnos a profesionales/pacientes inactivos | — | — | — | ⏳ Pendiente |
| **M9** Sin gestión de usuarios | — | — | — | ⏳ Fuera del alcance del plan |
| **B1** Orden de turnos por string | `appointment-sort.test.ts` | `4895be7` → `56c29ee` | #6 | ✅ |
| **B2** Actividad con la hora de creación | `dashboard.test.ts` (`it.todo`) | — | — | ⏳ Documentado, pendiente |
| **B3–B8** (profesional sin ficha, health público, headers, escalabilidad, transacciones, next-auth beta) | — | — | — | ⏳ Pendientes. B7 mitigado para turnos por las transacciones de M2 |
| **B9** Faltan tests | Toda la suite | — | #5–#9 | ✅ |

### Hallazgos nuevos durante el testing

| Hallazgo | Cómo apareció | Rojo → Fix | PR |
|---|---|---|---|
| Editar un turno pasado se rechazaba como alta | Test del parser de turnos | `3f20434` → `4de6b90` | #6 |
| El parser de turnos descartaba `previousTime` y `now` | Revisión del fix de M3 | `fa00ddc` → `880effb` | #6 |
| Un choque de horario respondía 400 en vez de 409 | Tests de integración | `61974d7` → `340a173` | #7 |
| `tailwind.config.ts` rompía `next dev` en Node 24 | Primer arranque de los E2E | `4f63f34` | #9 |
| Test flaky: login antes de la hidratación | CI de E2E | `42ca2f7` | #9 |

## 5. Casos de regresión del reporte

| # | Caso | Test | Resultado |
|---|---|---|---|
| 1 | Cancelar un turno después de sacarle ese día al profesional | `appointments.int.test.ts` (A2) | ✅ |
| 2 | Crear un turno "para hoy" de noche (22:00 ART) | `date-utils.test.ts` (M1) | ✅ Escenario adaptado: desde #8 no hay turnos después de las 18:00, así que se prueba que a las 21:30 ART un turno de mañana siga siendo futuro |
| 3 | Crear un turno para hoy a una hora que ya pasó | `appointment-validation.test.ts`, `appointment-slots.test.ts` (M3) | ✅ |
| 4 | Mismo paciente, misma hora, dos profesionales | `appointment-validation.test.ts`, `appointments.int.test.ts`, `e2e/agenda.spec.ts` (M2) | ✅ |
| 5 | `/login?callbackUrl=https://example.com` | `safe-callback-url.test.ts`, `e2e/auth.spec.ts` (A4) | ✅ |
| 6 | Desactivar un usuario con la sesión abierta → 401 | `auth.int.test.ts` (A3) | ✅ |
| 7 | `db:seed:minimal` con datos existentes → aborta | `scripts.int.test.ts` (A1) | ✅ |
| 8 | Turno futuro pendiente + atendido pasado → "último turno" = atendido | `patient-appointments.test.ts`, `appointments.int.test.ts` (M6) | ✅ |

## 6. E2E (Playwright)

| Flujo del plan | Spec | Resultado |
|---|---|---|
| Login por rol; ruta protegida vuelve a su URL; `callbackUrl` externo queda en la app | `auth.spec.ts` | ✅ |
| Recepción agenda un turno (ocupados deshabilitados, toast, aparece en la agenda) | `agenda.spec.ts` | ✅ El Dashboard no se verifica: muestra el día actual y los turnos de prueba son futuros |
| Mismo paciente a la misma hora → mensaje de solapamiento | `agenda.spec.ts` | ✅ |
| Pendiente → Confirmado → Atendido; eliminar solo en estado final | `agenda.spec.ts` | ✅ |
| Profesional: sin acceso a Profesionales, solo sus turnos | `profesional.spec.ts` | ✅ |
| Rate limit: 5 contraseñas erróneas bloquean el login | `auth.spec.ts` | ✅ |
| Mobile 390 px: agenda en tarjetas, menú colapsable | `mobile.spec.ts` | ✅ |

Estabilidad: 17/17 en CI sin reintentos; localmente 31/31 con `--repeat-each=2` y 17/17 desde un arranque en frío.

## 7. Cómo reproducir

```bash
npm test                 # unitarios (también: TZ=UTC npm test)
npm run test:coverage    # cobertura; reporte HTML en coverage/index.html
npm run test:int         # requiere base migrada + db:seed y npm run dev con VERIFY_SECRET
npm run test:e2e         # requiere base migrada + db:seed (levanta npm run dev)
```

Integración y E2E crean y borran datos: nunca contra la base de producción (ver [CI.md](CI.md)). La evidencia de cada corrida está en GitHub Actions (workflow **CI**, jobs *Unit tests*, *Verify DB + API* y *E2E (Playwright)*).

## 8. Limitaciones y trabajo futuro

- **Cobertura del servidor por líneas:** integración y E2E no suman a la métrica de líneas. Se podría instrumentar `next dev` con `NODE_V8_COVERAGE` para medirla.
- **Hallazgos pendientes:** M8, B2–B8 y las decisiones de producto de M4 (borrado solo para admin) y A3 (duración de la sesión).
- **Concurrencia de M2:** los locks cubren las escrituras de la app; no hay una restricción de base equivalente al índice único del profesional para el paciente.
