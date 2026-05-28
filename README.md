# KineTurnos

**Gestión kinesiológica moderna para consultorios**

Sistema web de demostración para organizar turnos, pacientes y profesionales en un consultorio de kinesiología. Diseñado como **case study de portfolio**: flujos completos, UI responsive y decisiones de arquitectura documentadas.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

| | |
|---|---|
| **Demo en vivo** | **[kineturnos.vercel.app](https://kineturnos.vercel.app/)** |
| **Repositorio** | [github.com/Matiglorioso/kineturnos](https://github.com/Matiglorioso/kineturnos) |
| **Case study** | [kineturnos.vercel.app/proyecto](https://kineturnos.vercel.app/proyecto) |
| **Versión** | Demo v0.1 · 2026 |

---

## Descripción

**KineTurnos** es una aplicación front-end que simula la operación diaria de un consultorio kinesiológico: panel de control, agenda por día o semana, fichas de pacientes y gestión del equipo profesional.

La demo prioriza **claridad de flujos**, **feedback inmediato** (toasts, estados vacíos, confirmaciones) y una **experiencia responsive** (mobile, tablet y desktop), con persistencia local para que el evaluador pueda interactuar sin backend.

---

## Problema que resuelve

En muchos consultorios, la coordinación de pacientes, profesionales y horarios depende de planillas, WhatsApp o agendas genéricas que no contemplan:

- Duración variable de sesiones
- Estados del turno (pendiente, confirmado, atendido, cancelado, ausente)
- Disponibilidad por profesional
- Historial por paciente

Eso genera **solapamientos**, **poca visibilidad del día** y **dificultad para seguir la carga de cada kinesiólogo**.

**KineTurnos** centraliza esa operación en una sola interfaz pensada para recepción y profesionales, reduciendo fricción en tareas repetitivas del día a día.

---

## Funcionalidades principales

### Panel de control
- Métricas del día: turnos totales, confirmados, pendientes, cancelados y pacientes activos
- Próximos turnos y actividad reciente
- Resumen por estado con distribución visual

### Agenda
- Vista **lista** (turnos del día) y **semanal** (lun–sáb)
- Filtros por estado y profesional
- Creación, edición y cambio de estado de turnos
- Validación de solapamientos y horarios del profesional
- Tabla en desktop y **cards apiladas** en mobile

### Pacientes
- Alta, edición, búsqueda y detalle con ficha completa
- Próximos turnos e historial de sesiones
- Activación / desactivación y eliminación con confirmación

### Profesionales
- CRUD de kinesiólogos con especialidad, días y horario de atención
- Duración estándar por sesión
- Turnos asignados y contador del día

### Experiencia de producto
- Modales accesibles (Radix UI)
- Toasts de éxito y error
- Empty states con acciones contextuales
- Diseño responsive y branding consistente (teal / salud)

---

## Capturas

> _Agregar imágenes del proyecto en `docs/screenshots/` y referenciarlas aquí._

| Dashboard | Agenda semanal |
|:---:|:---:|
| _![Dashboard](./docs/screenshots/dashboard.png)_ | _![Agenda](./docs/screenshots/agenda-semana.png)_ |

| Pacientes | Profesionales |
|:---:|:---:|
| _![Pacientes](./docs/screenshots/pacientes.png)_ | _![Profesionales](./docs/screenshots/profesionales.png)_ |

---

## Demo

**[https://kineturnos.vercel.app/](https://kineturnos.vercel.app/)**

También podés explorar el **case study interactivo** en [/proyecto](https://kineturnos.vercel.app/proyecto), con stack, decisiones técnicas, limitaciones de la demo y roadmap.

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
| **localStorage** | Persistencia sin backend en la demo |

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

### Variables de entorno (opcional)

```env
# URL base para metadata Open Graph (deploy)
NEXT_PUBLIC_SITE_URL=https://kineturnos.vercel.app
```

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
    │   └── proyecto/       # Case study del portfolio
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
    ├── data/               # Mocks iniciales
    ├── hooks/              # Persistencia y estado de UI
    ├── lib/                # Validación, fechas, toasts, dominio
    └── types/              # Tipos TypeScript del dominio
```

### Decisiones técnicas destacadas

- **Hooks de datos persistidos** (`usePersistedPatients`, `usePersistedAppointments`, `usePersistedProfessionals`) unifican lectura/escritura en `localStorage`
- **Formato de fecha `dd-MM-yyyy`** explícito en toda la app para evitar ambigüedad
- **Validación de turnos en capa de dominio** (`lib/appointment-validation.ts`) antes del submit
- **Patrón `closeDetailBeforeAction`** para evitar overlays congelados entre Dialog y AlertDialog

---

## Estado actual

| Área | Estado |
|---|---|
| UI / UX responsive | ✅ Completo |
| CRUD pacientes, profesionales y turnos | ✅ Completo |
| Agenda lista + semanal | ✅ Completo |
| Validación de horarios y solapamientos | ✅ Completo |
| Persistencia local | ✅ Completo |
| Branding, metadata y favicon | ✅ Completo |
| Backend / API | ❌ No incluido |
| Autenticación y roles | ❌ No incluido |
| Notificaciones externas (email / WhatsApp) | ❌ No incluido |

### Limitaciones de la demo

- Sin autenticación ni permisos por rol
- Datos en el navegador (`localStorage`); no hay sincronización entre dispositivos
- Un solo consultorio (sin multi-sede)
- Sin facturación, obras sociales avanzadas ni historial clínico detallado

---

## Roadmap futuro

### Corto plazo
- Backend con API REST o tRPC + PostgreSQL
- Autenticación y permisos por rol (recepción / profesional / admin)
- Sincronización de nombre de paciente en turnos al editar ficha

### Mediano plazo
- Recordatorios automáticos y confirmación por link
- Reportes exportables (PDF / Excel) y métricas históricas
- Bloqueo de agenda por feriados y sobreturnos

### Largo plazo
- Multi-consultorio y turnos online
- Integración con obras sociales y fichas clínicas
- App móvil o PWA para profesionales en sala

---

## Autor

**Matías Aliaga**

<!-- Agregar links personales cuando corresponda -->

| | |
|---|---|
| **GitHub** | [github.com/Matiglorioso/kineturnos](https://github.com/Matiglorioso/kineturnos) |
| **Demo** | [kineturnos.vercel.app](https://kineturnos.vercel.app/) |

---

## Licencia

Proyecto de demostración para portfolio. _[Definir licencia si se publica en GitHub — ej. MIT]_

---

<p align="center">
  Hecho con Next.js y TypeScript · Demo v0.1 · 2026
</p>
