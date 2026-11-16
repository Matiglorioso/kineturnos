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
        # El paquete Turnos ya tiene su diagrama de clases y sus colaboraciones (clases-turnos y los de la tesis).
        "clases": None,
        "colaboraciones": {},
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
                "interfaz": "UI Pacientes", "control": "GestorPacientes",
                "entidades": ["Paciente", "ObraSocial", "Auditoria"],
                "mensajes": [
                    ("interfaz", "control", "1: solicitarRegistrarPaciente(datos)"),
                    ("control", "Paciente", "2: existeDni(dni)"),
                    ("control", "ObraSocial", "3: obtenerDatos(obraSocial)"),
                    ("control", "Paciente", "4: crear(datos)"),
                    ("control", "Auditoria", "5: registrarAlta(paciente)"),
                    ("control", "interfaz", "6: mostrarPacienteRegistrado()"),
                ],
            },
            "2.2": {
                "interfaz": "UI Pacientes", "control": "GestorPacientes",
                "entidades": ["Paciente", "ObraSocial", "Turno", "Auditoria"],
                "mensajes": [
                    ("interfaz", "control", "1: solicitarActualizarPaciente(id, datos)"),
                    ("control", "Paciente", "2: obtenerDatos(id)"),
                    ("control", "Paciente", "3: existeDni(dni)"),
                    ("control", "ObraSocial", "4: obtenerDatos(obraSocial)"),
                    ("control", "Paciente", "5: actualizar(datos)"),
                    ("control", "Turno", "6: actualizarNombrePaciente(id, nombre)"),
                    ("control", "Auditoria", "7: registrarModificacion(antes, despues)"),
                    ("control", "interfaz", "8: mostrarPacienteActualizado()"),
                ],
            },
            "2.4": {
                "interfaz": "UI Pacientes", "control": "GestorPacientes",
                "entidades": ["Turno", "HistoriaClinica", "Paciente", "Auditoria"],
                "mensajes": [
                    ("interfaz", "control", "1: solicitarEliminarPaciente(id)"),
                    ("control", "Turno", "2: contarActivos(paciente)"),
                    ("control", "HistoriaClinica", "3: existeDe(paciente)"),
                    ("control", "Paciente", "4: eliminar(id)"),
                    ("control", "Auditoria", "5: registrarBaja(paciente)"),
                    ("control", "interfaz", "6: mostrarResultado()"),
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
                "interfaz": "UI Profesionales", "control": "GestorProfesionales",
                "entidades": ["Profesional", "Auditoria"],
                "mensajes": [
                    ("interfaz", "control", "1: solicitarRegistrarProfesional(datos)"),
                    ("control", "Profesional", "2: existeMatricula(matricula)"),
                    ("control", "Profesional", "3: crear(datos)"),
                    ("control", "Auditoria", "4: registrarAlta(profesional)"),
                    ("control", "interfaz", "5: mostrarProfesionalRegistrado()"),
                ],
            },
            "3.4": {
                "interfaz": "UI Profesionales", "control": "GestorProfesionales",
                "entidades": ["Turno", "Profesional", "Auditoria"],
                "mensajes": [
                    ("interfaz", "control", "1: solicitarEliminarProfesional(id)"),
                    ("control", "Turno", "2: contarActivos(profesional)"),
                    ("control", "Profesional", "3: eliminar(id)"),
                    ("control", "Auditoria", "4: registrarBaja(profesional)"),
                    ("control", "interfaz", "5: mostrarResultado()"),
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
                "interfaz": "UI Historia Clínica", "control": "GestorHistoriaClinica",
                "entidades": ["Turno", "HistoriaClinica", "AccesoHistoriaClinica", "Auditoria"],
                "mensajes": [
                    ("interfaz", "control", "1: solicitarRegistrarEvolucion(paciente, datos)"),
                    ("control", "Turno", "2: existeCon(profesional, paciente)"),
                    ("control", "HistoriaClinica", "3: crear(datos)"),
                    ("control", "AccesoHistoriaClinica", "4: registrar(usuario, alta)"),
                    ("control", "Auditoria", "5: registrarAlta(registro)"),
                    ("control", "interfaz", "6: mostrarHistoriaActualizada()"),
                ],
            },
            "4.2": {
                "interfaz": "UI Historia Clínica", "control": "GestorHistoriaClinica",
                "entidades": ["HistoriaClinica", "AccesoHistoriaClinica", "Auditoria"],
                "mensajes": [
                    ("interfaz", "control", "1: solicitarCorregir(registro, datos)"),
                    ("control", "HistoriaClinica", "2: puedeEditar(usuario)"),
                    ("control", "HistoriaClinica", "3: corregir(datos)"),
                    ("control", "AccesoHistoriaClinica", "4: registrar(usuario, edicion)"),
                    ("control", "Auditoria", "5: registrarModificacion(antes, despues)"),
                    ("control", "interfaz", "6: mostrarRegistroCorregido()"),
                ],
            },
            "4.3": {
                "interfaz": "UI Historia Clínica", "control": "GestorHistoriaClinica",
                "entidades": ["Turno", "Paciente", "HistoriaClinica", "AccesoHistoriaClinica"],
                "mensajes": [
                    ("interfaz", "control", "1: consultarHistoria(paciente)"),
                    ("control", "Turno", "2: existeCon(profesional, paciente)"),
                    ("control", "Paciente", "3: obtenerDatos()"),
                    ("control", "HistoriaClinica", "4: obtenerRegistros(paciente)"),
                    ("control", "AccesoHistoriaClinica", "5: registrar(usuario, lectura)"),
                    ("control", "interfaz", "6: mostrarHistoria()"),
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
                "interfaz": "UI Obras Sociales", "control": "GestorObrasSociales",
                "entidades": ["Paciente", "Autorizacion", "Turno", "Auditoria"],
                "mensajes": [
                    ("interfaz", "control", "1: solicitarRegistrarAutorizacion(paciente, datos)"),
                    ("control", "Paciente", "2: obtenerDatos()"),
                    ("control", "Autorizacion", "3: crear(datos)"),
                    ("control", "Turno", "4: vincularAtendidosSinAutorizacion(paciente)"),
                    ("control", "Auditoria", "5: registrarAlta(autorizacion)"),
                    ("control", "interfaz", "6: mostrarCobertura()"),
                ],
            },
            "5.4": {
                "interfaz": "UI Obras Sociales", "control": "GestorObrasSociales",
                "entidades": ["ObraSocial", "Turno", "Paciente"],
                "mensajes": [
                    ("interfaz", "control", "1: generarPlanilla(obraSocial, mes)"),
                    ("control", "ObraSocial", "2: obtenerDatos()"),
                    ("control", "Turno", "3: atendidosDelMes(obraSocial, mes)"),
                    ("control", "Paciente", "4: obtenerDatos()"),
                    ("control", "interfaz", "5: mostrarPlanilla()"),
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
                "interfaz": "UI Panel", "control": "GestorPanel",
                "entidades": ["Turno", "Profesional"],
                "mensajes": [
                    ("interfaz", "control", "1: calcularIndicadores(periodo)"),
                    ("control", "Turno", "2: obtenerTurnos(periodo)"),
                    ("control", "Turno", "3: obtenerTurnos(periodoAnterior)"),
                    ("control", "Profesional", "4: obtenerDatos()"),
                    ("control", "interfaz", "5: mostrarIndicadores()"),
                ],
            },
            "6.2": {
                "interfaz": "UI Panel", "control": "GestorPanel",
                "entidades": ["Turno", "GestorTurnos"],
                "mensajes": [
                    ("interfaz", "control", "1: obtenerTareasDelDia(fecha)"),
                    ("control", "Turno", "2: obtenerTurnos(sinAsistencia, porConfirmar)"),
                    ("control", "interfaz", "3: mostrarTareas()"),
                    ("interfaz", "control", "4: resolverTarea(turno, estado)"),
                    ("control", "GestorTurnos", "5: cambiarEstado(turno, estado)"),
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
                "interfaz": "UI Ingreso", "control": "GestorAccesos",
                "entidades": ["LoginIntento", "Usuario", "Auditoria"],
                "mensajes": [
                    ("interfaz", "control", "1: iniciarSesion(email, contrasena)"),
                    ("control", "LoginIntento", "2: estaBloqueado(email, ip)"),
                    ("control", "Usuario", "3: verificarContrasena(contrasena)"),
                    ("control", "Usuario", "4: registrarIngreso()"),
                    ("control", "Auditoria", "5: registrar(ingreso)"),
                    ("control", "interfaz", "6: mostrarPanel()"),
                ],
            },
            "7.4": {
                "interfaz": "UI Usuarios", "control": "GestorAccesos",
                "entidades": ["Usuario", "Profesional", "Auditoria"],
                "mensajes": [
                    ("interfaz", "control", "1: crearUsuario(datos)"),
                    ("control", "Usuario", "2: existeEmail(email)"),
                    ("control", "Profesional", "3: obtenerDatos()"),
                    ("control", "Usuario", "4: crear(datos, contrasenaTemporal)"),
                    ("control", "Auditoria", "5: registrarAlta(usuario)"),
                    ("control", "interfaz", "6: mostrarContrasenaTemporal()"),
                ],
            },
            "7.5": {
                "interfaz": "UI Auditoría", "control": "GestorAccesos",
                "entidades": ["Auditoria"],
                "mensajes": [
                    ("interfaz", "control", "1: consultarAuditoria(periodo)"),
                    ("control", "Auditoria", "2: consultar(periodo)"),
                    ("control", "interfaz", "3: mostrarMovimientos()"),
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
                "interfaz": "API de recordatorios", "control": "GestorNotificaciones",
                "entidades": ["Turno", "Notificacion", "ServicioDeCorreo"],
                "mensajes": [
                    ("interfaz", "control", "1: encolarRecordatorios(ahora)"),
                    ("control", "Turno", "2: obtenerActivosEntre(2h, 24h)"),
                    ("control", "Notificacion", "3: crear(recordatorio, clave)"),
                    ("control", "ServicioDeCorreo", "4: enviar(correo)"),
                    ("control", "Notificacion", "5: marcarEnviada()"),
                ],
            },
            "8.3": {
                "interfaz": "Página del turno", "control": "GestorNotificaciones",
                "entidades": ["Turno", "Auditoria"],
                "mensajes": [
                    ("interfaz", "control", "1: verificarEnlace(token)"),
                    ("control", "Turno", "2: obtenerDatos(id)"),
                    ("control", "Turno", "3: confirmar() o cancelar()"),
                    ("control", "Auditoria", "4: registrarCambioEstado(paciente)"),
                    ("control", "interfaz", "5: mostrarResultado()"),
                ],
            },
        },
    },
}
