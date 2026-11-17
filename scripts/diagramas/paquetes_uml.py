"""
Diagramas UML de cada paquete (tesis, capítulo de modelado): casos de uso del
paquete, vista estática (clases) y un diagrama de colaboración por cada caso de
uso principal, con el mismo estilo que los del paquete Turnos.

Los datos están en PAQUETES; drawio.py los dibuja. Los casos de uso y su
numeración coinciden con CATALOGO (árbol de casos de uso).
"""

# Mensajes de colaboración: (origen, destino, texto). "interfaz" y "control" son los
# objetos de la interfaz y del gestor; el resto, entidades u otros gestores.
# Relaciones: (caso origen, caso destino, "include" | "extend"). Los casos de otros
# paquetes van en "externos": (número, nombre, paquete).

PAQUETES = {
    "turnos": {
        "numero": 1,
        "nombre": "Gestión de Turnos y Agenda",
        "actores": ["Administrador", "Profesional"],
        "casos": [
            ("1.1", "Crear Turno", ["Administrador"]),
            ("1.2", "Reprogramar Turno", ["Administrador"]),
            ("1.3", "Confirmar Turno", ["Administrador"]),
            ("1.4", "Cancelar Turno", ["Administrador"]),
            ("1.5", "Registrar Asistencia", ["Administrador", "Profesional"]),
            ("1.6", "Eliminar Turno", ["Administrador"]),
            ("1.7", "Consultar Agenda", ["Administrador", "Profesional"]),
        ],
        "externos": [
            ("2.5", "Buscar Paciente", "Gestión de Pacientes"),
            ("8.1", "Enviar Notificación de Turno", "Notificaciones"),
        ],
        "orden": ["1.7", "1.1", "1.2", "1.3", "1.4", "1.5", "1.6"],
        "derecha": [],
        "actores_izquierda": True,
        "relaciones": [
            ("1.1", "2.5", "include"),
            ("1.1", "8.1", "include"),
            ("1.2", "8.1", "include"),
            ("1.3", "8.1", "include"),
            ("1.4", "8.1", "include"),
            ("1.1", "1.7", "extend"),
        ],
        # El paquete Turnos ya tiene su diagrama de clases (clases-turnos).
        "clases": None,
        "asociaciones_cu": ["1.1", "1.2", "1.4", "1.7"],
        "colaboraciones": {
            "1.1": {
                "interfaz": "IU: Turno", "control": "GestorTurnos",
                "entidades": ["Paciente", "Profesional", "Turno", "GestorNotificaciones", "Auditoria"],
                "mensajes": [
                    ("interfaz", "control", "1- Solicitar crear turno"),
                    ("control", "Paciente", "2- Obtener paciente"),
                    ("control", "Profesional", "3- Verificar que atiende ese día"),
                    ("control", "Turno", "4- Obtener turnos del día"),
                    ("control", "Turno", "5- Registrar turno"),
                    ("control", "GestorNotificaciones", "6- Encolar aviso de turno"),
                    ("control", "Auditoria", "7- Registrar alta"),
                    ("control", "interfaz", "8- Mostrar turno creado"),
                ],
            },
            "1.2": {
                "interfaz": "IU: Turno", "control": "GestorTurnos",
                "entidades": ["Turno", "Profesional", "GestorNotificaciones", "Auditoria"],
                "mensajes": [
                    ("interfaz", "control", "1- Solicitar reprogramar turno"),
                    ("control", "Turno", "2- Obtener turno"),
                    ("control", "Profesional", "3- Verificar que atiende ese día"),
                    ("control", "Turno", "4- Obtener turnos del día"),
                    ("control", "Turno", "5- Actualizar fecha y hora"),
                    ("control", "GestorNotificaciones", "6- Encolar aviso de reprogramación"),
                    ("control", "Auditoria", "7- Registrar modificación"),
                    ("control", "interfaz", "8- Mostrar turno actualizado"),
                ],
            },
            "1.4": {
                "interfaz": "IU: Agenda", "control": "GestorTurnos",
                "entidades": ["Turno", "GestorNotificaciones", "Auditoria"],
                "mensajes": [
                    ("interfaz", "control", "1- Solicitar cancelar turno"),
                    ("control", "Turno", "2- Obtener turno"),
                    ("control", "Turno", "3- Cancelar turno"),
                    ("control", "GestorNotificaciones", "4- Encolar aviso de cancelación"),
                    ("control", "Auditoria", "5- Registrar cambio de estado"),
                    ("control", "interfaz", "6- Mostrar turno cancelado"),
                ],
            },
            "1.7": {
                "interfaz": "IU: Agenda", "control": "GestorTurnos",
                "entidades": ["Turno", "Profesional"],
                "mensajes": [
                    ("interfaz", "control", "1- Consultar agenda"),
                    ("control", "Turno", "2- Obtener turnos del día"),
                    ("control", "Profesional", "3- Obtener profesional"),
                    ("control", "interfaz", "4- Mostrar agenda"),
                ],
            },
        },
    },
    "pacientes": {
        "numero": 2,
        "nombre": "Gestión de Pacientes",
        "actores": ["Administrador", "Profesional"],
        "casos": [
            ("2.1", "Registrar Paciente", ["Administrador"]),
            ("2.2", "Actualizar Paciente", ["Administrador"]),
            ("2.3", "Desactivar Paciente", ["Administrador"]),
            ("2.4", "Eliminar Paciente", ["Administrador"]),
            ("2.5", "Buscar Paciente", ["Administrador", "Profesional"]),
        ],
        "relaciones": [
            ("2.2", "2.5", "include"),
            ("2.3", "2.5", "include"),
            ("2.4", "2.5", "include"),
            ("2.3", "2.2", "extend"),
        ],
        "clases": [
            ("«control»", "GestorPacientes", [], [
                "+registrarPaciente(datos)", "+actualizarPaciente(id, datos)", "+desactivarPaciente(id)",
                "+eliminarPaciente(id)", "+buscarPacientes(texto)",
            ]),
            ("«entidad»", "Paciente", [
                "-id: String", "-nombrePila: String", "-apellido: String", "-dni: String", "-cuil: String",
                "-fechaNacimiento: Date", "-telefono: String", "-email: String", "-nroAfiliado: String",
                "-planObraSocial: String", "-estado: EstadoPaciente", "-observaciones: String",
            ], ["+existeDni(dni): boolean", "+obtenerDatos()", "+buscar(texto)"]),
            ("«entidad»", "ObraSocial", ["-id: String", "-nombre: String", "-activo: boolean"], ["+obtenerDatos()"]),
            ("«entidad»", "Turno", ["-id: String", "-fecha: Date", "-hora: Time", "-estado: EstadoTurno"],
             ["+contarActivos(paciente): int"]),
            ("«entidad»", "HistoriaClinica", ["-id: String", "-fecha: Date", "-evolucion: String"],
             ["+existeDe(paciente): boolean"]),
        ],
        "asociaciones": [
            ("Paciente", "ObraSocial", "0..*", "0..1"),
            ("Paciente", "Turno", "1", "0..*"),
            ("Paciente", "HistoriaClinica", "1", "0..*"),
        ],
        "colaboraciones": {
            "2.1": {
                "interfaz": "IU: Pacientes", "control": "GestorPacientes",
                "entidades": ["Paciente", "ObraSocial", "Auditoria"],
                "mensajes": [
                    ("interfaz", "control", "1- Solicitar registrar paciente"),
                    ("control", "Paciente", "2- Verificar DNI único"),
                    ("control", "ObraSocial", "3- Obtener obra social"),
                    ("control", "Paciente", "4- Registrar paciente"),
                    ("control", "Auditoria", "5- Registrar alta"),
                    ("control", "interfaz", "6- Mostrar paciente registrado"),
                ],
            },
            "2.2": {
                "interfaz": "IU: Pacientes", "control": "GestorPacientes",
                "entidades": ["Paciente", "ObraSocial", "Turno", "Auditoria"],
                "mensajes": [
                    ("interfaz", "control", "1- Solicitar actualizar paciente"),
                    ("control", "Paciente", "2- Obtener paciente"),
                    ("control", "Paciente", "3- Verificar DNI único"),
                    ("control", "ObraSocial", "4- Obtener obra social"),
                    ("control", "Paciente", "5- Actualizar paciente"),
                    ("control", "Turno", "6- Actualizar nombre en sus turnos"),
                    ("control", "Auditoria", "7- Registrar modificación"),
                    ("control", "interfaz", "8- Mostrar paciente actualizado"),
                ],
            },
            "2.4": {
                "interfaz": "IU: Pacientes", "control": "GestorPacientes",
                "entidades": ["Turno", "HistoriaClinica", "Paciente", "Auditoria"],
                "mensajes": [
                    ("interfaz", "control", "1- Solicitar eliminar paciente"),
                    ("control", "Turno", "2- Verificar turnos activos"),
                    ("control", "HistoriaClinica", "3- Verificar historia clínica"),
                    ("control", "Paciente", "4- Eliminar paciente"),
                    ("control", "Auditoria", "5- Registrar baja"),
                    ("control", "interfaz", "6- Mostrar resultado"),
                ],
            },
        },
    },
    "profesionales": {
        "numero": 3,
        "nombre": "Gestión de Profesionales",
        "actores": ["Administrador"],
        "casos": [
            ("3.1", "Registrar Profesional", ["Administrador"]),
            ("3.2", "Actualizar Profesional", ["Administrador"]),
            ("3.3", "Desactivar Profesional", ["Administrador"]),
            ("3.4", "Eliminar Profesional", ["Administrador"]),
        ],
        "relaciones": [("3.3", "3.2", "extend")],
        "clases": [
            ("«control»", "GestorProfesionales", [], [
                "+registrarProfesional(datos)", "+actualizarProfesional(id, datos)",
                "+desactivarProfesional(id)", "+eliminarProfesional(id)",
            ]),
            ("«entidad»", "Profesional", [
                "-id: String", "-nombrePila: String", "-apellido: String", "-matricula: String",
                "-especialidad: String", "-email: String", "-telefono: String", "-diasAtencion: String[]",
                "-activo: boolean", "-observaciones: String",
            ], ["+existeMatricula(matricula): boolean", "+obtenerDatos()", "+atiendeEl(fecha): boolean"]),
            ("«entidad»", "Turno", ["-id: String", "-fecha: Date", "-hora: Time", "-estado: EstadoTurno"],
             ["+contarActivos(profesional): int"]),
            ("«entidad»", "Usuario", ["-id: String", "-email: String", "-rol: RolUsuario", "-activo: boolean"],
             ["+obtenerDatos()"]),
        ],
        "asociaciones": [
            ("Profesional", "Turno", "1", "0..*"),
            ("Profesional", "Usuario", "0..1", "0..1"),
        ],
        "colaboraciones": {
            "3.1": {
                "interfaz": "IU: Profesionales", "control": "GestorProfesionales",
                "entidades": ["Profesional", "Auditoria"],
                "mensajes": [
                    ("interfaz", "control", "1- Solicitar registrar profesional"),
                    ("control", "Profesional", "2- Verificar matrícula única"),
                    ("control", "Profesional", "3- Registrar profesional"),
                    ("control", "Auditoria", "4- Registrar alta"),
                    ("control", "interfaz", "5- Mostrar profesional registrado"),
                ],
            },
            "3.4": {
                "interfaz": "IU: Profesionales", "control": "GestorProfesionales",
                "entidades": ["Turno", "Profesional", "Auditoria"],
                "mensajes": [
                    ("interfaz", "control", "1- Solicitar eliminar profesional"),
                    ("control", "Turno", "2- Verificar turnos activos"),
                    ("control", "Profesional", "3- Eliminar profesional"),
                    ("control", "Auditoria", "4- Registrar baja"),
                    ("control", "interfaz", "5- Mostrar resultado"),
                ],
            },
        },
    },
    "clinica": {
        "numero": 4,
        "nombre": "Gestión Clínica",
        "actores": ["Profesional", "Administrador"],
        "casos": [
            ("4.1", "Registrar Evolución", ["Profesional"]),
            ("4.2", "Corregir Evolución", ["Profesional"]),
            ("4.3", "Consultar Historia Clínica", ["Profesional", "Administrador"]),
            ("4.4", "Registrar Alertas y Antecedentes", ["Profesional"]),
            ("4.5", "Gestionar Objetivos de Tratamiento", ["Profesional"]),
            ("4.6", "Consultar Registro de Accesos", ["Administrador"]),
        ],
        "relaciones": [
            ("4.1", "4.3", "extend"),
            ("4.2", "4.3", "extend"),
            ("4.4", "4.3", "extend"),
            ("4.5", "4.3", "extend"),
        ],
        "clases": [
            ("«control»", "GestorHistoriaClinica", [], [
                "+consultarHistoria(paciente)", "+registrarEvolucion(paciente, datos)",
                "+corregirEvolucion(registro, datos)", "+guardarFicha(paciente, datos)",
                "+gestionarObjetivo(paciente, datos)", "+tieneAcceso(usuario, paciente): boolean",
            ]),
            ("«entidad»", "HistoriaClinica", [
                "-id: String", "-fecha: Date", "-diagnostico: String", "-tratamiento: String",
                "-evolucion: String", "-autorNombre: String", "-creadoEn: DateTime",
            ], ["+crear(datos)", "+corregir(datos)", "+puedeEditar(usuario): boolean"]),
            ("«entidad»", "Paciente", ["-id: String", "-nombre: String", "-dni: String"], ["+obtenerDatos()"]),
            ("«entidad»", "Turno", ["-id: String", "-fecha: Date", "-estado: EstadoTurno"],
             ["+existeCon(profesional, paciente): boolean"]),
            ("«entidad»", "AccesoHistoriaClinica", ["-usuarioNombre: String", "-accion: AccionHistoria", "-fecha: DateTime"],
             ["+registrar(usuario, accion)"]),
        ],
        "asociaciones": [
            ("HistoriaClinica", "Paciente", "0..*", "1"),
            ("HistoriaClinica", "Turno", "0..1", "0..1"),
            ("HistoriaClinica", "AccesoHistoriaClinica", "1", "0..*"),
        ],
        "colaboraciones": {
            "4.1": {
                "interfaz": "IU: Historia Clínica", "control": "GestorHistoriaClinica",
                "entidades": ["Turno", "HistoriaClinica", "AccesoHistoriaClinica", "Auditoria"],
                "mensajes": [
                    ("interfaz", "control", "1- Solicitar registrar evolución"),
                    ("control", "Turno", "2- Verificar turno con el paciente"),
                    ("control", "HistoriaClinica", "3- Registrar evolución"),
                    ("control", "AccesoHistoriaClinica", "4- Registrar acceso"),
                    ("control", "Auditoria", "5- Registrar alta"),
                    ("control", "interfaz", "6- Mostrar historia actualizada"),
                ],
            },
            "4.2": {
                "interfaz": "IU: Historia Clínica", "control": "GestorHistoriaClinica",
                "entidades": ["HistoriaClinica", "AccesoHistoriaClinica", "Auditoria"],
                "mensajes": [
                    ("interfaz", "control", "1- Solicitar corregir evolución"),
                    ("control", "HistoriaClinica", "2- Verificar autor y plazo de 24 h"),
                    ("control", "HistoriaClinica", "3- Corregir registro"),
                    ("control", "AccesoHistoriaClinica", "4- Registrar acceso"),
                    ("control", "Auditoria", "5- Registrar modificación"),
                    ("control", "interfaz", "6- Mostrar registro corregido"),
                ],
            },
            "4.3": {
                "interfaz": "IU: Historia Clínica", "control": "GestorHistoriaClinica",
                "entidades": ["Turno", "Paciente", "HistoriaClinica", "AccesoHistoriaClinica"],
                "mensajes": [
                    ("interfaz", "control", "1- Consultar historia clínica"),
                    ("control", "Turno", "2- Verificar turno con el paciente"),
                    ("control", "Paciente", "3- Obtener paciente"),
                    ("control", "HistoriaClinica", "4- Obtener sesiones registradas"),
                    ("control", "AccesoHistoriaClinica", "5- Registrar acceso"),
                    ("control", "interfaz", "6- Mostrar historia clínica"),
                ],
            },
        },
    },
    "obras": {
        "numero": 5,
        "nombre": "Gestión de Obras Sociales",
        "actores": ["Administrador"],
        "casos": [
            ("5.1", "Gestionar Catálogo de Obras Sociales", ["Administrador"]),
            ("5.2", "Registrar Autorización", ["Administrador"]),
            ("5.3", "Consultar Autorizaciones", ["Administrador"]),
            ("5.4", "Generar Planilla Mensual", ["Administrador"]),
        ],
        "relaciones": [("5.2", "5.3", "extend")],
        "clases": [
            ("«control»", "GestorObrasSociales", [], [
                "+registrarAutorizacion(paciente, datos)", "+reasignarSesiones(paciente)",
                "+consultarAutorizaciones(filtros)", "+generarPlanilla(obraSocial, mes)",
            ]),
            ("«entidad»", "Autorizacion", [
                "-id: String", "-numero: String", "-estado: EstadoAutorizacion", "-sesiones: int",
                "-fechaDesde: Date", "-vencimiento: Date", "-observaciones: String",
            ], ["+crear(datos)", "+sesionesUsadas(): int", "+estaVigente(fecha): boolean"]),
            ("«entidad»", "ObraSocial", ["-id: String", "-nombre: String", "-activo: boolean"], ["+obtenerDatos()"]),
            ("«entidad»", "Paciente", ["-id: String", "-nombre: String", "-nroAfiliado: String"], ["+obtenerDatos()"]),
            ("«entidad»", "Turno", ["-id: String", "-fecha: Date", "-estado: EstadoTurno"],
             ["+atendidosDelMes(obraSocial, mes)"]),
        ],
        "asociaciones": [
            ("Autorizacion", "ObraSocial", "0..*", "1"),
            ("Autorizacion", "Paciente", "0..*", "1"),
            ("Autorizacion", "Turno", "0..1", "0..*"),
        ],
        "colaboraciones": {
            "5.2": {
                "interfaz": "IU: Obras Sociales", "control": "GestorObrasSociales",
                "entidades": ["Paciente", "Autorizacion", "Turno", "Auditoria"],
                "mensajes": [
                    ("interfaz", "control", "1- Solicitar registrar autorización"),
                    ("control", "Paciente", "2- Obtener paciente"),
                    ("control", "Autorizacion", "3- Registrar autorización"),
                    ("control", "Turno", "4- Vincular sesiones sin autorización"),
                    ("control", "Auditoria", "5- Registrar alta"),
                    ("control", "interfaz", "6- Mostrar cobertura"),
                ],
            },
            "5.4": {
                "interfaz": "IU: Obras Sociales", "control": "GestorObrasSociales",
                "entidades": ["ObraSocial", "Turno", "Paciente"],
                "mensajes": [
                    ("interfaz", "control", "1- Solicitar planilla del mes"),
                    ("control", "ObraSocial", "2- Obtener obra social"),
                    ("control", "Turno", "3- Obtener sesiones atendidas del mes"),
                    ("control", "Paciente", "4- Obtener paciente"),
                    ("control", "interfaz", "5- Mostrar planilla"),
                ],
            },
        },
    },
    "dashboard": {
        "numero": 6,
        "nombre": "Dashboard",
        "actores": ["Administrador", "Profesional"],
        "casos": [
            ("6.1", "Visualizar Indicadores", ["Administrador", "Profesional"]),
            ("6.2", "Resolver Tareas del Día", ["Administrador", "Profesional"]),
        ],
        "externos": [
            ("1.3", "Confirmar Turno", "Gestión de Turnos y Agenda"),
            ("1.5", "Registrar Asistencia", "Gestión de Turnos y Agenda"),
        ],
        "relaciones": [("6.2", "1.3", "include"), ("6.2", "1.5", "include")],
        "clases": [
            ("«control»", "GestorPanel", [], [
                "+calcularIndicadores(periodo)", "+compararConAnterior(periodo)", "+obtenerTareasDelDia(fecha)",
                "+obtenerAtajos(fecha)",
            ]),
            ("«entidad»", "Turno", ["-id: String", "-fecha: Date", "-hora: Time", "-estado: EstadoTurno"],
             ["+obtenerTurnos(periodo)"]),
            ("«entidad»", "Profesional", ["-id: String", "-nombre: String"], ["+obtenerDatos()"]),
            ("«entidad»", "Autorizacion", ["-id: String", "-estado: EstadoAutorizacion", "-vencimiento: Date"],
             ["+sinCobertura()"]),
        ],
        "asociaciones": [("Turno", "Profesional", "0..*", "1"), ("Turno", "Autorizacion", "0..*", "0..1")],
        "colaboraciones": {
            "6.1": {
                "interfaz": "IU: Panel", "control": "GestorPanel",
                "entidades": ["Turno", "Profesional"],
                "mensajes": [
                    ("interfaz", "control", "1- Solicitar indicadores del período"),
                    ("control", "Turno", "2- Obtener turnos del período"),
                    ("control", "Turno", "3- Obtener turnos del período anterior"),
                    ("control", "Profesional", "4- Obtener profesional"),
                    ("control", "interfaz", "5- Mostrar indicadores"),
                ],
            },
            "6.2": {
                "interfaz": "IU: Panel", "control": "GestorPanel",
                "entidades": ["Turno", "GestorTurnos"],
                "mensajes": [
                    ("interfaz", "control", "1- Solicitar tareas del día"),
                    ("control", "Turno", "2- Obtener turnos por resolver"),
                    ("control", "interfaz", "3- Mostrar tareas"),
                    ("interfaz", "control", "4- Resolver tarea"),
                    ("control", "GestorTurnos", "5- Cambiar estado del turno"),
                ],
            },
        },
    },
    "seguridad": {
        "numero": 7,
        "nombre": "Seguridad y Accesos",
        "actores": ["Administrador", "Profesional", "Superadmin"],
        "casos": [
            ("7.1", "Iniciar Sesión", ["Administrador", "Profesional"]),
            ("7.2", "Cerrar Sesión", ["Administrador", "Profesional"]),
            ("7.3", "Cambiar Contraseña", ["Administrador", "Profesional"]),
            ("7.4", "Gestionar Usuarios", ["Administrador"]),
            ("7.5", "Consultar Auditoría", ["Superadmin"]),
        ],
        "orden": ["7.1", "7.3", "7.2", "7.4", "7.5"],
        "derecha": [],
        "actores_izquierda": True,
        "relaciones": [("7.3", "7.1", "extend")],
        "clases": [
            ("«control»", "GestorAccesos", [], [
                "+iniciarSesion(email, contrasena)", "+cerrarSesion()", "+cambiarContrasena(actual, nueva)",
                "+crearUsuario(datos)", "+restablecerContrasena(usuario)", "+tienePermiso(rol, permiso): boolean",
            ]),
            ("«entidad»", "Usuario", [
                "-id: String", "-email: String", "-nombre: String", "-passwordHash: String", "-rol: RolUsuario",
                "-activo: boolean", "-debeCambiarPassword: boolean", "-ultimoIngreso: DateTime",
            ], ["+verificarContrasena(texto): boolean", "+obtenerDatos()"]),
            ("«entidad»", "LoginIntento", ["-clave: String", "-fallos: int", "-bloqueadoHasta: DateTime"],
             ["+estaBloqueado(): boolean", "+registrarFallo()"]),
            ("«entidad»", "Auditoria", ["-fecha: DateTime", "-usuarioNombre: String", "-accion: AccionAuditoria",
                                       "-registro: String", "-cambios: JSON", "-ip: String"],
             ["+registrar(evento)", "+consultar(periodo)"]),
            ("«entidad»", "Profesional", ["-id: String", "-nombre: String"], ["+obtenerDatos()"]),
        ],
        "asociaciones": [("Usuario", "Profesional", "0..1", "0..1"), ("Usuario", "Auditoria", "0..1", "0..*")],
        "colaboraciones": {
            "7.1": {
                "interfaz": "IU: Ingreso", "control": "GestorAccesos",
                "entidades": ["LoginIntento", "Usuario", "Auditoria"],
                "mensajes": [
                    ("interfaz", "control", "1- Solicitar ingreso"),
                    ("control", "LoginIntento", "2- Verificar bloqueo por intentos"),
                    ("control", "Usuario", "3- Verificar contraseña"),
                    ("control", "Usuario", "4- Registrar último ingreso"),
                    ("control", "Auditoria", "5- Registrar ingreso"),
                    ("control", "interfaz", "6- Mostrar panel"),
                ],
            },
            "7.4": {
                "interfaz": "IU: Usuarios", "control": "GestorAccesos",
                "entidades": ["Usuario", "Profesional", "Auditoria"],
                "mensajes": [
                    ("interfaz", "control", "1- Solicitar crear usuario"),
                    ("control", "Usuario", "2- Verificar correo único"),
                    ("control", "Profesional", "3- Obtener profesional"),
                    ("control", "Usuario", "4- Registrar usuario con contraseña temporal"),
                    ("control", "Auditoria", "5- Registrar alta"),
                    ("control", "interfaz", "6- Mostrar contraseña temporal"),
                ],
            },
            "7.5": {
                "interfaz": "IU: Auditoría", "control": "GestorAccesos",
                "entidades": ["Auditoria"],
                "mensajes": [
                    ("interfaz", "control", "1- Consultar auditoría del período"),
                    ("control", "Auditoria", "2- Obtener movimientos"),
                    ("control", "interfaz", "3- Mostrar movimientos"),
                ],
            },
        },
    },
    "notificaciones": {
        "numero": 8,
        "nombre": "Notificaciones",
        "actores": ["Tarea programada", "Paciente"],
        "casos": [
            ("8.1", "Enviar Notificación de Turno", ["Tarea programada"]),
            ("8.2", "Enviar Recordatorio de Turno", ["Tarea programada"]),
            ("8.3", "Confirmar o Cancelar desde el Correo", ["Paciente"]),
        ],
        "relaciones": [],
        "clases": [
            ("«control»", "GestorNotificaciones", [], [
                "+encolar(turno, tipo)", "+enviarPendientes()", "+encolarRecordatorios(ahora)",
                "+verificarEnlace(token): Turno",
            ]),
            ("«entidad»", "Notificacion", [
                "-id: String", "-tipo: TipoNotificacion", "-estado: EstadoNotificacion", "-destinatario: String",
                "-clave: String", "-intentos: int", "-enviadaEn: DateTime",
            ], ["+crear(datos)", "+marcarEnviada()", "+marcarFallida(error)"]),
            ("«entidad»", "Turno", ["-id: String", "-fecha: Date", "-hora: Time", "-estado: EstadoTurno"],
             ["+confirmar()", "+cancelar()"]),
            ("«sistema»", "ServicioDeCorreo", [], ["+enviar(correo)"]),
        ],
        "asociaciones": [("Notificacion", "Turno", "0..*", "1")],
        "colaboraciones": {
            "8.2": {
                "interfaz": "IU: Tarea programada", "control": "GestorNotificaciones",
                "entidades": ["Turno", "Notificacion", "ServicioDeCorreo"],
                "mensajes": [
                    ("interfaz", "control", "1- Solicitar recordatorios"),
                    ("control", "Turno", "2- Obtener turnos de las próximas 24 h"),
                    ("control", "Notificacion", "3- Encolar recordatorio"),
                    ("control", "ServicioDeCorreo", "4- Enviar correo"),
                    ("control", "Notificacion", "5- Marcar como enviada"),
                ],
            },
            "8.3": {
                "interfaz": "IU: Página del Turno", "control": "GestorNotificaciones",
                "entidades": ["Turno", "Auditoria"],
                "mensajes": [
                    ("interfaz", "control", "1- Verificar enlace"),
                    ("control", "Turno", "2- Obtener turno"),
                    ("control", "Turno", "3- Confirmar o cancelar turno"),
                    ("control", "Auditoria", "4- Registrar cambio de estado"),
                    ("control", "interfaz", "5- Mostrar resultado"),
                ],
            },
        },
    },
}
