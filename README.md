# KineTurnos

**Gestión kinesiológica moderna para consultorios**

Sistema web para organizar turnos, pacientes y profesionales en consultorios de kinesiología. Producto **KineTurnos v1.0**, desplegado con PostgreSQL, autenticación y panel operativo completo.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
![CI](https://github.com/Matiglorioso/kineturnos/actions/workflows/ci.yml/badge.svg)

| | |
|---|---|
| **Aplicación** | **[kineturnos.vercel.app](https://kineturnos.vercel.app/)** |
| **Repositorio** | [github.com/Matiglorioso/kineturnos](https://github.com/Matiglorioso/kineturnos) |
| **Versión** | v1.0 · PostgreSQL + Auth · 2026 |
| **Base de datos** | PostgreSQL (Neon) + Prisma — [setup local](docs/TU-PARTE-NEON.md) · [deploy Vercel](docs/TU-PARTE-VERCEL.md) |
| **Documentación** | [Fases](docs/FASES.md) · [Arquitectura](docs/ARQUITECTURA.md) · [Modelo de datos (DER)](docs/DER.md) · [Pruebas](docs/TESTING.md) · [Rendimiento](docs/RENDIMIENTO.md) · [Disponibilidad](docs/DISPONIBILIDAD.md) · [Respaldos](docs/RESPALDOS.md) · [Notificaciones](docs/NOTIFICACIONES.md) |

---

## Descripción

**KineTurnos** es una aplicación full-stack para la operación diaria de un consultorio kinesiológico: panel de control, agenda por día o semana, fichas de pacientes y gestión del equipo profesional.

La aplicación prioriza **claridad de flujos**, **feedback inmediato** (toasts, estados vacíos, confirmaciones) y una **experiencia responsive** (mobile, tablet y desktop), con **persistencia en PostgreSQL (Neon)** vía API REST y Prisma.

---

## Problema que resuelve

En muchos consultorios, la coordinación de pacientes, profesionales y horarios depende de planillas, WhatsApp o agendas genéricas que no contemplan:

- Duración variable de sesiones
- Estados del turno (pendiente, confirmado, atendido, cancelado, ausente)
- Disponibilidad por profesional
- Historial por paciente

Eso genera **solapamientos**, **poca visibilidad del día** y **dificultad para seguir la carga de cada kinesiólogo**.

**KineTurnos** centraliza esa operación en una sola interfaz pensada para administración y profesionales, reduciendo fricción en tareas repetitivas del día a día.

---

## Funcionalidades principales

### Panel de control
- Saludo, fecha y atajos para **agendar un turno** o **registrar un paciente**
- **Accesos rápidos** a Agenda, Pacientes, Obras sociales y Profesionales (según el perfil)
- **Hoy**: turnos del día, asistencias por registrar, turnos por confirmar del próximo día y autorizaciones para gestionar
- **Agenda de hoy** (con el turno en curso resaltado) y **Para hacer**: marcar atendido/ausente, confirmar turnos (con el teléfono para llamar) y autorizaciones vencidas o por renovar, sin salir del panel
- **Indicadores (RF16)** de esta semana, este mes o el mes anterior, comparados con el período anterior: sesiones atendidas, pacientes atendidos, tasa de cancelación y de ausentismo, evolución y turnos por profesional

### Agenda
- Vistas por **día**, por **semana** (lun–sáb) y por **profesional** (RF03): el día de todos los profesionales en columnas, con los horarios libres a un toque de "Agendar turno" (en celular, un profesional a la vez)
- Filtros por estado, paciente y profesional
- Creación, edición y cambio de estado de turnos
- Validación de solapamientos y horarios del profesional
- **Correos al paciente** al crear, confirmar, reprogramar o cancelar un turno, y recordatorio 24 h antes ([`docs/NOTIFICACIONES.md`](docs/NOTIFICACIONES.md))
- Tabla en desktop y **cards apiladas** en mobile

### Pacientes
- Búsqueda por nombre, DNI (con o sin puntos), CUIL (con o sin guiones), teléfono u obra social
- Alta, edición y detalle con ficha completa: DNI, CUIL (validado con el dígito verificador y contra el DNI), fecha de nacimiento y edad, contacto y obra social
- **Historia clínica digital**: un registro por sesión con evolución, diagnóstico y plan de tratamiento; diagnóstico y plan vigentes; alertas clínicas, antecedentes y objetivos del tratamiento; vista de impresión; acceso por perfil y registro de accesos (quién leyó o modificó, y cuándo)
- Próximos turnos e historial de sesiones
- Activación / desactivación y eliminación con confirmación

### Obras sociales
- Catálogo de obras sociales y prepagas; cada paciente con su obra social, número de afiliado y plan
- Autorizaciones con cantidad de sesiones y vencimiento: las sesiones se descuentan solas al marcar los turnos como atendidos
- Avisos (sin bloquear) cuando falta la autorización, está en trámite, se agotó o venció
- Planilla de asistencia mensual por obra social, lista para imprimir

### Profesionales
- CRUD de kinesiólogos con especialidad y días de atención (turnos de 1 hora, horario del consultorio 08:00 a 18:00)
- Turnos asignados y contador del día

### Usuarios
- Página **Usuarios** (solo Administración): alta con perfil y profesional vinculado, búsqueda y filtros por perfil y estado, último ingreso
- **Contraseña temporal** al crear o restablecer un acceso (se muestra una sola vez); en el primer ingreso la persona tiene que elegir una propia
- Los usuarios no se borran: se **desactivan** y pierden el acceso al instante
- Cada usuario cambia su contraseña desde el menú de su cuenta; solo un Superadmin gestiona otros Superadmin
- Atajo **Acceso al sistema** desde la ficha de cada profesional

### Experiencia de producto
- Modales accesibles (Radix UI)
- Toasts de éxito y error
- Empty states con acciones contextuales
- Diseño responsive y branding consistente (teal / salud)

---

## Capturas

Datos de demostración, con nombres ficticios.

### Desktop (1440px)

| Panel | Agenda del día |
|:---:|:---:|
| ![Panel](./docs/screenshots/dashboard-desktop.png) | ![Agenda del día](./docs/screenshots/agenda-dia-desktop.png) |

| Agenda semanal | Agenda por profesional |
|:---:|:---:|
| ![Agenda semanal](./docs/screenshots/agenda-semana-desktop.png) | ![Agenda por profesional](./docs/screenshots/agenda-profesionales-desktop.png) |

| Pacientes | Historia clínica |
|:---:|:---:|
| ![Pacientes](./docs/screenshots/pacientes-desktop.png) | ![Historia clínica](./docs/screenshots/historia-clinica-desktop.png) |

| Autorizaciones | Planilla mensual por obra social |
|:---:|:---:|
| ![Autorizaciones](./docs/screenshots/autorizaciones-desktop.png) | ![Planilla mensual](./docs/screenshots/planilla-desktop.png) |

| Profesionales | Usuarios |
|:---:|:---:|
| ![Profesionales](./docs/screenshots/profesionales-desktop.png) | ![Usuarios](./docs/screenshots/usuarios-desktop.png) |

### Mobile (390px)

| Panel | Agenda | Agenda por profesional | Historia clínica |
|:---:|:---:|:---:|:---:|
| ![Panel](./docs/screenshots/dashboard.png) | ![Agenda](./docs/screenshots/agenda.png) | ![Agenda por profesional](./docs/screenshots/agenda-profesionales.png) | ![Historia clínica](./docs/screenshots/historia-clinica.png) |

| Agenda semanal | Pacientes | Profesionales | Usuarios |
|:---:|:---:|:---:|:---:|
| ![Agenda semanal](./docs/screenshots/agenda-semana.png) | ![Pacientes](./docs/screenshots/pacientes.png) | ![Profesionales](./docs/screenshots/profesionales.png) | ![Usuarios](./docs/screenshots/usuarios.png) |

_Se regeneran con `npm run screenshots`: crea una base descartable con datos de demostración, compila la app y captura con Playwright._

---

## Acceso

**[https://kineturnos.vercel.app/](https://kineturnos.vercel.app/)**

La app requiere **login**. Los usuarios se crean con el seed mínimo o manualmente en la base.

**Go-live (producción)** — base vacía de pacientes/turnos:

```bash
npm run db:migrate:deploy
```

PowerShell (Windows):

```powershell
$env:SEED_INITIAL_PASSWORD="tu-contraseña-segura"
npm run db:seed:minimal
```

Bash / macOS / Linux:

```bash
SEED_INITIAL_PASSWORD="tu-contraseña-segura" npm run db:seed:minimal
```

Crea los perfiles de la app para **SANMAR SALUD**: **Superadmin** (equipo de desarrollo), dos **Administradores** (dueño y recepción) y un **Profesional** (sin vincular). Cambiá emails y contraseña antes de entregar al cliente.

| Perfil | Quiénes | Puede |
|---|---|---|
| Superadmin | Equipo de desarrollo | Todo (y a futuro, tareas técnicas de mantenimiento) |
| Administrador | Dueños y recepción | Turnos, pacientes, profesionales, obras sociales, usuarios y dashboard |
| Profesional | Kinesiólogos | Su propia agenda y el registro de asistencia |

> Si la base ya tiene datos, el seed **aborta** sin tocar nada. Para restablecer la contraseña de los usuarios iniciales sobre una base en uso: `npm run db:seed:minimal -- --force` (nunca borra pacientes, profesionales ni turnos).

**Desarrollo local** — datos de ejemplo completos:

```bash
npm run db:seed
```

Sobre una base con datos aborta; para borrar todo y recargar los mocks: `npx prisma db seed -- --force`.

La sección **Ayuda** (`/proyecto`) está disponible una vez autenticado.

---

## Tecnologías

| Tecnología | Uso en el proyecto |
|---|---|
| **Next.js 15** | App Router, layouts por módulo, metadata SEO |
| **React 19** | Componentes client para interactividad |
| **TypeScript** | Tipos de dominio: `Patient`, `Appointment`, `Professional` |
| **Tailwind CSS** | Sistema visual, responsive, animaciones |
| **shadcn/ui + Radix** | Diálogos, selects, alertas accesibles |
| **Lucide React** | Iconografía consistente |
| **date-fns** | Fechas en español y lógica de calendario |
| **Sonner** | Notificaciones toast |
| **Neon + Prisma 6** | PostgreSQL serverless + ORM |
| **API Routes (Next.js)** | CRUD REST: pacientes, profesionales, turnos |

---

## Instalación y ejecución

### Requisitos

- **Node.js** 18.18 o superior
- **npm** 9+

### Pasos

```bash
# Clonar el repositorio
git clone https://github.com/Matiglorioso/kineturnos.git
cd kineturnos

# Instalar dependencias
npm install

# Modo desarrollo
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) en el navegador.

### Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run dev:clean` | Libera el puerto 3000, limpia caché y arranca dev |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción (post-build) |
| `npm run lint` | ESLint |
| `npm run clean` | Elimina caché de `.next` |
| `npm run db:push` | Sincroniza schema → DB (solo desarrollo puntual) |
| `npm run db:migrate:deploy` | Aplica migraciones en producción / CI |
| `npm run db:seed` | Datos de desarrollo (mocks + usuarios; sin turnos; bloqueado en producción; aborta si la base tiene datos, salvo `--force`) |
| `npm run db:seed:minimal` | Solo usuarios iniciales (go-live; requiere `SEED_INITIAL_PASSWORD`; nunca borra datos; con datos existentes aborta, salvo `--force`) |
| `npm run db:purge-demo` | **Destructivo:** borra pacientes/profesionales mock (no solo turnos) |
| `npm run db:restore-demo-people` | Vuelve a cargar pacientes/profesionales mock; no crea turnos |
| `npm run db:clear-turnos` | Borra todos los turnos y limpia `ultimoTurno` |
| `npm run db:studio` | Prisma Studio (UI de la DB) |
| `npm run test:int` | Prueba automática DB + API (requiere `npm run dev` y `VERIFY_SECRET`) |
| `npm run test:coverage` | Cobertura de los unitarios (c8); reporte HTML en `coverage/`. Resultados: [docs/TESTING.md](docs/TESTING.md) |
| `npm run test:e2e` | Tests E2E con Playwright (levanta `npm run dev`; base sembrada con `db:seed`, nunca producción) |
| `npm run verify:production` | Smoke test de kineturnos.vercel.app + usuarios en Neon |
| `npm run perf` | Prueba de rendimiento con volumen real en una base descartable ([docs/RENDIMIENTO.md](docs/RENDIMIENTO.md)) |
| `npm run screenshots` | Regenera las capturas de `docs/screenshots` con datos de demostración |
| `npm run diagramas` | Genera los diagramas de la tesis en draw.io (`docs/diagramas/*.drawio`); se exportan a PNG con draw.io ([detalle](docs/diagramas/README.md)) |
| `npm run disponibilidad` | Porcentaje de disponibilidad según el monitoreo ([docs/DISPONIBILIDAD.md](docs/DISPONIBILIDAD.md)) |

### Variables de entorno

```env
DATABASE_URL="postgresql://..."   # Neon (requerido)
AUTH_SECRET="..."                 # Auth.js (requerido para login)
VERIFY_SECRET="..."               # Bypass auth en test:int (local/CI)
CRON_SECRET="..."                 # Cron de recordatorios (Vercel + GitHub Actions)
BREVO_API_KEY="..."               # Envío de correos (solo producción)
MAIL_FROM_EMAIL="..."             # Remitente verificado en Brevo
NEXT_PUBLIC_SITE_URL=https://kineturnos.vercel.app
```

Copiá la plantilla desde `env.example` → `.env`.

**Local:** guía rápida en [`docs/TU-PARTE-NEON.md`](docs/TU-PARTE-NEON.md)  
**Producción (Vercel):** [`docs/TU-PARTE-VERCEL.md`](docs/TU-PARTE-VERCEL.md)  
**CI / verify:** [`docs/CI.md`](docs/CI.md)  
**Referencia completa:** [`docs/GUIA-NEON-PRISMA.md`](docs/GUIA-NEON-PRISMA.md)

```bash
npm run db:push    # Crear tablas en Neon
npm run db:seed          # Datos completos de desarrollo
npm run db:seed:minimal  # Go-live: solo usuarios (requiere SEED_INITIAL_PASSWORD)
npm run db:studio  # Ver la DB en el navegador
npm run test:int   # Verificar migración (con dev server activo)
```

---

## Deploy en Vercel

1. Agregar **`DATABASE_URL`** (connection string **Pooled** de Neon) en Environment Variables
2. Agregar **`AUTH_SECRET`** y **`NEXT_PUBLIC_SITE_URL`** = `https://kineturnos.vercel.app`
3. **Redeploy**
4. Probar login en `https://kineturnos.vercel.app/login` y `/api/health/db`

Detalle paso a paso: [`docs/TU-PARTE-VERCEL.md`](docs/TU-PARTE-VERCEL.md)

---

## Estructura del proyecto

```
kineturnos/
├── public/                 # Favicon e íconos estáticos
├── scripts/                # Utilidades CLI (limpieza de caché, puerto)
└── src/
    ├── app/                # Rutas App Router
    │   ├── page.tsx        # Dashboard (/)
    │   ├── agenda/         # Agenda lista y semanal
    │   ├── pacientes/      # Gestión de pacientes
    │   ├── profesionales/  # Gestión de kinesiólogos
    │   ├── proyecto/       # Ayuda (requiere login)
    │   └── api/            # REST: patients, professionals, appointments, health/db
    ├── components/
    │   ├── agenda/         # Vistas de calendario
    │   ├── appointments/   # Turnos, badges, acciones
    │   ├── brand/          # Logo e identidad
    │   ├── dashboard/      # Widgets del panel
    │   ├── layout/         # Shell, sidebar, header
    │   ├── patients/       # Cards, tablas, diálogos
    │   ├── professionals/  # Cards y formularios
    │   ├── shared/         # Componentes reutilizables
    │   └── ui/             # Primitivos (shadcn-style)
    ├── data/               # Mocks para seed
    ├── hooks/              # usePatients, useProfessionals, useAppointments
    ├── lib/                # Validación, fechas, toasts, capa DB
    └── types/              # Tipos TypeScript del dominio
```

### Decisiones técnicas destacadas

- **Hooks de dominio** (`usePatients`, `useProfessionals`, `useAppointments`) consumen la API REST y mantienen estado en cliente con toasts de error
- **Validación en cliente y servidor** (DNI/matrícula únicos, solapamiento de turnos, horarios del profesional)
- **Formato de fecha `dd-MM-yyyy`** explícito en toda la app para evitar ambigüedad
- **Validación de turnos en capa de dominio** (`lib/appointment-validation.ts`) reutilizada en formularios y API
- **Patrón `closeDetailBeforeAction`** para evitar overlays congelados entre Dialog y AlertDialog

---

## Estado actual

| Área | Estado |
|---|---|
| UI / UX responsive | ✅ Completo |
| CRUD pacientes, profesionales y turnos | ✅ Completo |
| Agenda por día, semana y profesional (RF03) | ✅ Completo |
| Validación de horarios y solapamientos | ✅ Completo (cliente + servidor) |
| PostgreSQL (Neon) + Prisma | ✅ Completo |
| API REST + hooks conectados a DB | ✅ Completo |
| Validación DNI / matrícula únicos | ✅ Completo |
| Autenticación (login + middleware) | ✅ Completo |
| Sync `ultimo_turno` y nombres en turnos | ✅ Completo |
| CI GitHub Actions (lint, build, verify) | ✅ Completo |
| Migraciones Prisma formales | ✅ Completo |
| Deploy Vercel con `DATABASE_URL` + `AUTH_SECRET` | 📋 [Guía](docs/TU-PARTE-VERCEL.md) |
| Branding, metadata y favicon | ✅ Completo |
| Historia clínica digital (RF11-RF13, RNF06-RNF07) | ✅ Completo |
| Obras sociales y autorizaciones (RF07, RF14, RF15) | ✅ Completo |
| Indicadores de gestión del panel (RF16) | ✅ Completo |
| Notificaciones por email (RF05) | ✅ Completo ([config](docs/NOTIFICACIONES.md)) |
| Gestión de usuarios y contraseñas | ✅ Completo |
| Búsqueda de pacientes por nombre, DNI o CUIL (RF08) | ✅ Completo |
| Monitoreo de disponibilidad 24 h (RNF08) | ✅ Completo ([detalle](docs/DISPONIBILIDAD.md)) |
| Respaldo diario cifrado de la base (RNF09) | ✅ Completo ([detalle](docs/RESPALDOS.md)) |
| Rendimiento medido con 6.640 turnos (RNF03, RNF04) | ✅ Completo ([informe](docs/RENDIMIENTO.md)) |
| Notificaciones por WhatsApp | ❌ No incluido |

---

## Autor

**Matías Aliaga**

<!-- Agregar links personales cuando corresponda -->

| | |
|---|---|
| **GitHub** | [github.com/Matiglorioso/kineturnos](https://github.com/Matiglorioso/kineturnos) |
| **App** | [kineturnos.vercel.app](https://kineturnos.vercel.app/) |

---

## Licencia

Proyecto privado / uso comercial. _[Definir licencia si se publica en GitHub — ej. MIT]_

---

<p align="center">
  Hecho con Next.js, TypeScript y PostgreSQL · KineTurnos v1.0 · 2026
</p>
