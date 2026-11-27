# Diagrama de clases — Gestión de Turnos y Agenda

Clases del paquete de negocio Gestión de Turnos y Agenda, tal como quedaron implementadas. Los turnos duran siempre 1 hora y el horario del consultorio (de lunes a viernes, de 07:00 a 12:00 y de 13:00 a 20:00, sin turnos a las 12:00) es común a todos los profesionales: cada profesional solo define sus días de atención.

```mermaid
classDiagram
    direction LR
    class GestorTurnos {
        <<control>>
        +crearTurno(paciente, profesional, fecha, hora, tipoSesion) Turno
        +reprogramarTurno(turno, fecha, hora)
        +cancelarTurno(turno)
        +registrarAsistencia(turno, asistio)
        +eliminarTurno(turno)
        +consultarAgenda(fecha, profesional, estado) Turno[]
        +validarDisponibilidad(profesional, fecha, hora) boolean
    }
    class Turno {
        <<entidad>>
        -id: String
        -fecha: Date
        -hora: Time
        -estado: EstadoTurno
        -tipoSesion: String
        -observaciones: String
        +confirmar()
        +reprogramar(fecha, hora)
        +cancelar()
        +registrarAsistencia(asistio: boolean)
        +esActivo() boolean
    }
    class Paciente {
        <<entidad>>
        -id: String
        -nombre: String
        -apellido: String
        -dni: String
        -cuil: String
        -fechaNacimiento: Date
        -telefono: String
        -email: String
        -obraSocial: String
        -estado: String
        +obtenerDatos()
        +obtenerContacto() String
    }
    class Profesional {
        <<entidad>>
        -id: String
        -nombre: String
        -apellido: String
        -matricula: String
        -especialidad: String
        -diasAtencion: String[]
        -activo: boolean
        +obtenerDatos()
        +atiendeEl(fecha) boolean
    }
    class EstadoTurno {
        <<enumeration>>
        PENDIENTE
        CONFIRMADO
        ATENDIDO
        CANCELADO
        AUSENTE
    }
    GestorTurnos ..> Turno : gestiona
    Turno "0..*" --> "1" Paciente
    Turno "0..*" --> "1" Profesional
    Turno ..> EstadoTurno
```

Un Turno pertenece a un único Paciente y un único Profesional; un Paciente o Profesional puede tener múltiples Turnos asociados.
