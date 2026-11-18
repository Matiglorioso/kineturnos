# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Administración** (dueño y recepción de SANMAR SALUD): usa el sistema todo el día en la computadora de recepción. Agenda, reprograma y cancela turnos, registra la asistencia, confirma por teléfono los turnos del día siguiente, carga pacientes y autorizaciones de obras sociales y arma la planilla mensual para facturar.
- **Profesional** (kinesiólogos): consulta su propia agenda, registra la asistencia de sus turnos y carga la evolución de cada sesión en la historia clínica, muchas veces desde el celular, entre paciente y paciente.
- **Superadmin** (equipo de desarrollo): soporte técnico y consulta de la auditoría; no participa de la operatoria.
- **Paciente**: no usa el sistema; recibe avisos y recordatorios por correo y puede confirmar o cancelar su turno desde el enlace, sin usuario.

## Product Purpose

Digitalizar la gestión del consultorio, que antes se llevaba en una agenda de papel, fichas físicas y WhatsApp: turnos sin superposiciones, pacientes, historia clínica por sesión, autorizaciones de obras sociales con descuento automático de sesiones, planilla mensual para facturar e indicadores. El éxito es que recepción termine el día con la asistencia registrada y los turnos de mañana confirmados, y que cada sesión quede en la historia clínica.

## Positioning

Hecho para la kinesiología, no para cualquier consultorio médico: la unidad de trabajo es la **sesión** de 1 hora, que se descuenta de la autorización de la obra social, se registra en la historia clínica y se factura en la planilla mensual. SANMAR SALUD es el primer cliente; la intención es ofrecerlo más adelante a otros consultorios de kinesiología, con una instalación por consultorio.

## Operating Context

- Consultorio en Córdoba Capital: recepción con una computadora (Windows 11, Chrome/Edge) y celulares de los profesionales.
- Horario común de 08:00 a 18:00, turnos de 1 hora; cada profesional define sus días de atención.
- La coordinación con los pacientes sigue por WhatsApp y teléfono; las autorizaciones se tramitan en los portales de las obras sociales (TRADITUM: Galeno, APROSS, etc.) y en el sistema se registran.
- Rutina diaria: empezar en el Panel («Para hacer»), registrar asistencia, confirmar los turnos del día siguiente; a fin de mes, la planilla de asistencia por obra social.

## Capabilities and Constraints

- Perfiles: Administración, Profesional y Superadmin, con permisos por perfil; el Profesional solo ve sus turnos y la historia clínica de sus pacientes.
- Estados del turno: pendiente, confirmado (activos); atendido, cancelado, ausente (finales).
- Fechas dd-mm-aaaa y horas de 24 h, con "hoy" en la hora de Buenos Aires.
- Todo en español rioplatense.
- Una instalación por consultorio: el nombre del consultorio se configura (`siteConfig.clinicName`).
- Sin facturación electrónica, pagos en línea, portal de turnos para pacientes ni avisos por WhatsApp (fuera del alcance de esta versión).

## Brand Commitments

- La identidad que manda es la del **consultorio** (SANMAR SALUD); **KineTurnos** queda como firma discreta del sistema. Como cada instalación es de un consultorio, la identidad del consultorio tiene que poder cambiar por instalación.
- Voz: cercana y clara, en rioplatense, con mensajes que dicen qué pasó y cómo seguir.

## Evidence on Hand

- Logo de SANMAR SALUD: solo hay una foto del cartel del consultorio, en el relevamiento de la tesis (fuera del repo). **Pendiente** conseguir el logo en SVG o PNG de buena calidad; no recrearlo ni inventarlo.
- Fotos reales del consultorio (recepción, sala de rehabilitación, consultorio) en el relevamiento de la tesis, fuera del repo; para usarlas hay que sumarlas al repo con el permiso del consultorio.
- Datos de demostración con nombres ficticios (`scripts/screenshots/demo-data.ts`); no hay testimonios, clientes adicionales ni métricas de uso publicables.

## Product Principles

1. El día de recepción primero: lo que hay que hacer hoy se ve y se resuelve en un toque.
2. La sesión es la unidad: turno, autorización, evolución y planilla hablan de la misma sesión.
3. Un error de carga se previene o se corrige, nunca queda atrapado.
4. Del consultorio, no de una plataforma: la identidad visible es la de cada consultorio.
5. Simple antes que completo: sin contadores ni adornos que no ayuden a decidir.

## Accessibility & Inclusion

Uso diario por personal sin formación técnica; los profesionales lo usan en el celular. Todas las pantallas tienen que funcionar en 390 px de ancho, sin desplazamiento horizontal (RNF02).
