# Rendimiento (RNF03, RNF04)

> **RNF03:** las consultas de agenda y pacientes deben responder en un tiempo no mayor a 3 segundos bajo uso normal.
> **RNF04:** el sistema debe soportar el volumen actual de operación (30-40 turnos diarios) sin degradación perceptible.

## Método

`npm run perf` ([`scripts/perf/run.ts`](../scripts/perf/run.ts)) arma un escenario reproducible y lo mide:

1. **Base descartable.** Crea una base nueva (`kineturnos_perf_…`) en la rama de pruebas de Neon, la migra y la borra al terminar.
2. **Volumen del consultorio.** Carga [`scripts/perf/seed-volume.ts`](../scripts/perf/seed-volume.ts), siempre con los mismos datos:
   - 6 meses de historia y 1 mes agendado hacia adelante, a **40 turnos por día hábil** y 20 los sábados: **6.640 turnos**;
   - 500 pacientes, 10 profesionales, 4 obras sociales;
   - 296 autorizaciones y 2.192 registros de historia clínica.

   Es el máximo del RNF04 sostenido durante 7 meses.
3. **App compilada para producción** (`next build` + `next start`), no el modo de desarrollo.
4. **API con varios usuarios a la vez.**
   - **Consultas:** 60 pedidos por escenario, con 6 usuarios simultáneos. Es más que el uso normal: dos recepcionistas y los profesionales consultando su agenda.
   - **Altas y cambios de estado:** 2 recepcionistas a la vez.
   - Se informan la mediana, el p95 (el 95 % de los pedidos tarda menos que eso) y el máximo.
5. **Pantallas en un navegador real** (Chromium, con Playwright). Se mide desde que se pide la página hasta que se puede usar: el panel con sus indicadores, la agenda y la lista de pacientes con datos. Son 5 cargas por pantalla y no cuenta la primera, que calienta cachés.

### Condiciones de la medición

La app corrió en la computadora de desarrollo, en Argentina, y la base en Neon, en São Paulo. **Cada consulta a la base tardó 137 ms de ida y vuelta.** En producción, la app corre en Vercel en la región `gru1` (São Paulo, ver abajo), al lado de la base, y esa ida y vuelta es de 1 a 2 ms.

Los tiempos de abajo son el **peor caso**: cada pantalla hace varias consultas, y cada una paga esa latencia.

## Resultados

### Primera medición: dónde estaban los cuellos de botella

| Escenario | Mediana | p95 | Límite 3 s |
|---|---|---|---|
| Lista de pacientes (API) | 2,47 s | 3,88 s | ❌ |
| Agendar un turno (API, 6 usuarios sobre el mismo profesional) | 6,63 s | 8,27 s | ❌ |
| Pantalla de la agenda | 4,23 s | 4,76 s (máx.) | ❌ |

Causas encontradas:

- **Lista de pacientes:** para mostrar el "último turno" de cada paciente traía **todos los turnos de todos los pacientes** (miles de filas) y los recorría en memoria. Ahora lo calcula la base con dos consultas agregadas (`groupBy`), con el mismo criterio de antes: último turno atendido con fecha hasta hoy.
- **Agendar y reprogramar:** para validar solapamientos cargaba **todos los turnos de la historia**, y lo hacía dentro de la transacción que bloquea al paciente y al profesional, lo que además frenaba a los demás. Ahora trae solo los turnos de ese día de ese profesional o de ese paciente, que son los únicos que pueden solaparse.
- **Pantalla de la agenda:** esperaba a la lista de pacientes. Se aceleró con el primer arreglo.

Las reglas no cambiaron. Los 85 tests de integración, entre ellos los de último turno (M6), solapamientos (M2) y concurrencia, pasan igual.

### Después de los arreglos (26-10-2026)

**API**

| Escenario | Usuarios a la vez | Mediana | p95 | Máximo | Tamaño | Límite 3 s |
|---|---|---|---|---|---|---|
| Turnos (todos, Administración) | 6 | 763 ms | 1,59 s | 4,55 s | 1,5 MB | ✅ |
| Turnos (los propios, Profesional) | 6 | 233 ms | 370 ms | 429 ms | 188 KB | ✅ |
| Pacientes (con cobertura) | 6 | 583 ms | 869 ms | 1,02 s | 193 KB | ✅ |
| Profesionales | 6 | 157 ms | 249 ms | 282 ms | 3 KB | ✅ |
| Autorizaciones | 6 | 358 ms | 452 ms | 544 ms | 103 KB | ✅ |
| Historia clínica de un paciente | 6 | 729 ms | 1,15 s | 1,20 s | 1 KB | ✅ |
| Agendar un turno (validaciones y bloqueo) | 2 | 697 ms | 1,01 s | 1,11 s | — | ✅ |
| Confirmar un turno (cambio de estado) | 2 | 651 ms | 773 ms | 1,15 s | — | ✅ |

Respuestas con error: 0 de 480.

**Pantallas** (desde que se pide hasta que se puede usar)

| Pantalla | Mediana | Máximo | Límite 3 s |
|---|---|---|---|
| Panel (hoy, para hacer e indicadores) | 1,95 s | 3,73 s | ✅ en la mediana |
| Agenda del día | 2,13 s | 2,66 s | ✅ |
| Lista de pacientes | 2,27 s | 2,66 s | ✅ |

**Mejora respecto de la primera medición:**

| Escenario | Antes | Después |
|---|---|---|
| Lista de pacientes (API, mediana) | 2,47 s | 0,58 s (−76 %) |
| Agendar un turno (API, mediana) | 6,63 s | 0,70 s (−89 %) |
| Pantalla de la agenda (mediana) | 4,23 s | 2,13 s (−50 %) |

### Conclusión

Con el volumen máximo previsto, sostenido durante 7 meses, y con 137 ms de latencia por consulta (peor que en producción):

- todas las consultas de la API responden por debajo de 3 s en el p95;
- las pantallas de agenda y pacientes quedan en 2,1 a 2,3 s.

El único valor por encima de 3 s fue una carga aislada del panel (3,7 s), en el arranque, con su mediana en 1,95 s. Se cumplen RNF03 y RNF04.

## Región de la app en producción

Hasta este cambio, Vercel ejecutaba la API en su región por defecto, `iad1` (Washington), mientras la base está en `sa-east-1` (São Paulo). Cada consulta cruzaba el continente.

[`vercel.json`](../vercel.json) fija ahora `"regions": ["gru1"]` (São Paulo): la API corre al lado de la base y más cerca del consultorio.

| Medición en producción (26-10-2026) | `iad1` (antes) | `gru1` (después) |
|---|---|---|
| `/api/health/db` (una consulta), mediana de 12 | 553 ms | **312 ms** (−44 %) |
| Mínimo / máximo | 516 / 972 ms | 294 / 560 ms |

Medido desde Argentina, con todo el recorrido incluido (conexión, Vercel y base). Los 312 ms restantes son casi todos de la red hasta Vercel. La consulta a la base, que antes cruzaba el continente, ahora ocurre dentro de São Paulo. En las pantallas que hacen varias consultas, la mejora se multiplica.

## Cómo repetirlo

```bash
npm run perf                      # base descartable + volumen + build + mediciones (unos 10 minutos)
npm run perf -- --sin-build       # reutiliza la compilación anterior (.next-perf)
npm run perf -- --salida informe.md
npm run perf -- --pedidos 100 --usuarios 8 --cargas 10
```

Usa `DATABASE_URL` de `.env.local`. Tiene que ser la rama de pruebas de Neon, **nunca la de producción**: el script crea y borra su propia base, pero corre en ese servidor.
