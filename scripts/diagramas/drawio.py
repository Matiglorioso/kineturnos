"""
Genera los diagramas de la tesis en formato draw.io (.drawio), con el estilo de
los originales: cajas UML en blanco y negro, título en negrita y subtítulo en
cursiva, multiplicidades en cada extremo.

    python scripts/diagramas/drawio.py      # escribe docs/diagramas/*.drawio

Después se exportan a PNG con draw.io Desktop (ver docs/diagramas/README.md).
"""
from pathlib import Path
from xml.sax.saxutils import escape

OUT = Path(__file__).resolve().parents[2] / "docs" / "diagramas"
FONT = "fontFamily=Helvetica;"


class Diagram:
    def __init__(self, name, width, height):
        self.name = name
        self.width = width
        self.height = height
        self.cells = []
        self.next_id = 2

    def _id(self):
        self.next_id += 1
        return f"c{self.next_id}"

    def add(self, xml):
        self.cells.append(xml)

    def text(self, x, y, w, h, html, style=""):
        cid = self._id()
        self.add(
            f'<mxCell id="{cid}" value="{escape(html)}" style="text;html=1;strokeColor=none;fillColor=none;'
            f'align=left;verticalAlign=top;whiteSpace=wrap;{FONT}{style}" vertex="1" parent="1">'
            f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>'
        )
        return cid

    def title(self, title, subtitle, x=30, y=30):
        self.text(x, y, 900, 26, f"<b>{title}</b>", "fontSize=18;")
        self.text(x, y + 24, 900, 20, f"<i>{subtitle}</i>", "fontSize=13;fontColor=#555555;")

    def box(self, x, y, w, h, html, style=""):
        cid = self._id()
        self.add(
            f'<mxCell id="{cid}" value="{escape(html)}" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;'
            f'strokeColor=#000000;{FONT}fontSize=12;{style}" vertex="1" parent="1">'
            f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>'
        )
        return cid

    def uml_class(self, x, y, w, header, attrs, methods=None, line_h=17, font=12, attr_min=0):
        """Clase UML: encabezado, bloque de atributos y (opcional) bloque de métodos."""
        header_h = 52 if "<br>" in header else 30
        attr_h = max(attr_min, line_h * len(attrs) + 12)
        meth_h = line_h * len(methods) + 12 if methods else 0
        total = header_h + attr_h + (meth_h + 8 if methods else 0)
        cid = self._id()
        self.add(
            f'<mxCell id="{cid}" value="{escape(header)}" style="swimlane;fontStyle=0;align=center;verticalAlign=top;'
            f'childLayout=stackLayout;horizontal=1;startSize={header_h};horizontalStack=0;resizeParent=1;'
            f'resizeParentMax=0;resizeLast=0;collapsible=0;marginBottom=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;'
            f'strokeColor=#000000;{FONT}fontSize={font + 1};" vertex="1" parent="1">'
            f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{total}" as="geometry"/></mxCell>'
        )
        row = "text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;" \
              f"overflow=hidden;rotatable=0;whiteSpace=wrap;html=1;{FONT}fontSize={font};"
        self.add(
            f'<mxCell id="{self._id()}" value="{escape("<br>".join(attrs))}" style="{row}" vertex="1" parent="{cid}">'
            f'<mxGeometry y="{header_h}" width="{w}" height="{attr_h}" as="geometry"/></mxCell>'
        )
        if methods:
            self.add(
                f'<mxCell id="{self._id()}" value="" style="line;strokeWidth=1;fillColor=none;align=left;'
                f'verticalAlign=middle;spacingTop=-1;spacingLeft=3;spacingRight=3;rotatable=0;labelPosition=right;'
                f'points=[];portConstraint=eastwest;strokeColor=#000000;" vertex="1" parent="{cid}">'
                f'<mxGeometry y="{header_h + attr_h}" width="{w}" height="8" as="geometry"/></mxCell>'
            )
            self.add(
                f'<mxCell id="{self._id()}" value="{escape("<br>".join(methods))}" style="{row}" vertex="1" parent="{cid}">'
                f'<mxGeometry y="{header_h + attr_h + 8}" width="{w}" height="{meth_h}" as="geometry"/></mxCell>'
            )
        return cid, total

    def edge(self, source, target, *, label="", src_mult="", tgt_mult="", dashed=False, arrow="none",
             start_arrow="none", exit_=None, entry=None, points=(), font=12, label_style=""):
        eid = self._id()
        style = (f"edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;endArrow={arrow};startArrow={start_arrow};"
                 f"endFill=0;startFill=0;strokeColor=#000000;{FONT}fontSize={font};{label_style}")
        if dashed:
            style += "dashed=1;"
        if exit_:
            style += f"exitX={exit_[0]};exitY={exit_[1]};exitDx=0;exitDy=0;"
        if entry:
            style += f"entryX={entry[0]};entryY={entry[1]};entryDx=0;entryDy=0;"
        pts = "".join(f'<mxPoint x="{px}" y="{py}"/>' for px, py in points)
        pts_xml = f'<Array as="points">{pts}</Array>' if points else ""
        self.add(
            f'<mxCell id="{eid}" value="{escape(label)}" style="{style}" edge="1" parent="1" source="{source}" target="{target}">'
            f'<mxGeometry relative="1" as="geometry">{pts_xml}</mxGeometry></mxCell>'
        )
        for value, pos, side in ((src_mult, -1, exit_), (tgt_mult, 1, entry)):
            if not value:
                continue
            # Desplazamiento hacia afuera de la caja, según el lado.
            if side and side[0] == 0:
                dx, dy, align, valign = -6, -2, "right", "bottom"
            elif side and side[1] == 1:
                dx, dy, align, valign = 6, 4, "left", "top"
            elif side and side[1] == 0:
                dx, dy, align, valign = 6, -4, "left", "bottom"
            else:
                dx, dy, align, valign = 6, -2, "left", "bottom"
            self.add(
                f'<mxCell id="{self._id()}" value="{escape(value)}" style="edgeLabel;resizable=0;html=1;'
                f'align={align};verticalAlign={valign};labelBackgroundColor=none;{FONT}fontSize={font};fontStyle=1;" '
                f'vertex="1" connectable="0" parent="{eid}">'
                f'<mxGeometry x="{pos}" relative="1" as="geometry"><mxPoint x="{dx}" y="{dy}" as="offset"/></mxGeometry></mxCell>'
            )
        return eid

    def actor(self, x, y, label, w=30, h=60):
        cid = self._id()
        self.add(
            f'<mxCell id="{cid}" value="{escape(label)}" style="shape=umlActor;verticalLabelPosition=bottom;'
            f'verticalAlign=top;html=1;outlineConnect=0;fillColor=#FFFFFF;strokeColor=#000000;{FONT}fontSize=12;'
            f'fontStyle=1;" vertex="1" parent="1"><mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>'
        )
        return cid

    def ellipse(self, x, y, w, h, html, style=""):
        cid = self._id()
        self.add(
            f'<mxCell id="{cid}" value="{escape(html)}" style="ellipse;whiteSpace=wrap;html=1;fillColor=#FFFFFF;'
            f'strokeColor=#000000;{FONT}fontSize=11;{style}" vertex="1" parent="1">'
            f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>'
        )
        return cid

    def package(self, x, y, w, h, html, style=""):
        cid = self._id()
        self.add(
            f'<mxCell id="{cid}" value="{escape(html)}" style="shape=folder;tabWidth=40;tabHeight=14;tabPosition=left;'
            f'html=1;whiteSpace=wrap;fillColor=#FFFFFF;strokeColor=#000000;{FONT}fontSize=12;fontStyle=1;spacingTop=12;'
            f'{style}" vertex="1" parent="1"><mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>'
        )
        return cid

    def note(self, x, y, w, h, html):
        cid = self._id()
        self.add(
            f'<mxCell id="{cid}" value="{escape(html)}" style="shape=note;size=12;whiteSpace=wrap;html=1;align=left;'
            f'verticalAlign=top;spacingLeft=6;spacingTop=2;fillColor=#FFFFFF;strokeColor=#000000;{FONT}fontSize=11;" '
            f'vertex="1" parent="1"><mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>'
        )
        return cid

    def line(self, source, target, label="", dashed=False, arrow="none", style=""):
        """Línea recta (sin ortogonal) con etiqueta en el medio."""
        eid = self._id()
        st = (f"edgeStyle=none;html=1;endArrow={arrow};endFill=0;strokeColor=#000000;{FONT}fontSize=11;"
              f"labelBackgroundColor=#FFFFFF;{'dashed=1;' if dashed else ''}{style}")
        self.add(
            f'<mxCell id="{eid}" value="{escape(label)}" style="{st}" edge="1" parent="1" source="{source}" target="{target}">'
            f'<mxGeometry relative="1" as="geometry"/></mxCell>'
        )
        return eid

    def write(self):
        body = "".join(self.cells)
        xml = (
            f'<mxfile host="drawio" type="device"><diagram id="{self.name}" name="{self.name}">'
            f'<mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" '
            f'fold="1" page="1" pageScale="1" pageWidth="{self.width}" pageHeight="{self.height}" background="#FFFFFF" math="0" shadow="0">'
            f'<root><mxCell id="0"/><mxCell id="1" parent="0"/>{body}</root></mxGraphModel></diagram></mxfile>'
        )
        path = OUT / f"{self.name}.drawio"
        path.write_text(xml, encoding="utf-8")
        print(f"OK {path.name}")


# ---------------------------------------------------------------- Diagrama de clases
def clases():
    d = Diagram("clases-turnos", 1450, 1140)
    d.title("Diagrama de Clases — Paquete", "Gestión de Turnos y Agenda")

    gestor, _ = d.uml_class(27, 400, 425, "«control»<br><b>GestorTurnos</b>", ["(sin atributos persistentes)"], [
        "+crearTurno(paciente, profesional, fecha, hora, tipoSesion)",
        "+reprogramarTurno(turno, fecha, hora)",
        "+cancelarTurno(turno)",
        "+registrarAsistencia(turno, asistio)",
        "+eliminarTurno(turno)",
        "+consultarAgenda(fecha, profesional, estado)",
        "+validarDisponibilidad(profesional, fecha, hora): boolean",
    ])
    turno, _ = d.uml_class(580, 348, 347, "«entidad»<br><b>Turno</b>", [
        "-id: String",
        "-fecha: Date",
        "-hora: Time",
        "-estado: EstadoTurno",
        "-tipoSesion: String",
        "-observaciones: String",
    ], [
        "+crear(datos)",
        "+confirmar()",
        "+reprogramar(fecha, hora)",
        "+cancelar()",
        "+registrarAsistencia(asistio: boolean)",
        "+obtenerTurnosActivos(profesional, fecha)",
        "+obtenerTurnos(filtros)",
    ])
    paciente, _ = d.uml_class(1107, 60, 310, "«entidad»<br><b>Paciente</b>", [
        "-id: String",
        "-nombre: String",
        "-apellido: String",
        "-dni: String",
        "-cuil: String",
        "-fechaNacimiento: Date",
        "-telefono: String",
        "-email: String",
        "-obraSocial: String",
        "-estado: String",
    ], ["+obtenerDatos()", "+obtenerContacto(): String"])
    profesional, _ = d.uml_class(1107, 566, 310, "«entidad»<br><b>Profesional</b>", [
        "-id: String",
        "-nombre: String",
        "-apellido: String",
        "-matricula: String",
        "-especialidad: String",
        "-diasAtencion: String[]",
        "-activo: boolean",
    ], ["+obtenerDatos()", "+atiendeEl(fecha): boolean"])
    estado, _ = d.uml_class(618, 900, 270, "«enumeration»<br><b>EstadoTurno</b>",
                            ["PENDIENTE", "CONFIRMADO", "ATENDIDO", "CANCELADO", "AUSENTE"])

    d.edge(gestor, turno, label="«usa»", dashed=True, arrow="open", label_style="fontStyle=2;")
    d.edge(turno, paciente, src_mult="0..*", tgt_mult="1", exit_=(1, 0.2), entry=(0, 0.75), label_style="edgeStyle=none;")
    d.edge(turno, profesional, src_mult="0..*", tgt_mult="1", exit_=(1, 0.65), entry=(0, 0.25), label_style="edgeStyle=none;")
    d.edge(turno, estado, dashed=True, arrow="open")
    d.text(30, 1075, 1380, 50,
           "<i>Un Turno pertenece a un único Paciente y a un único Profesional; un Paciente o un Profesional puede tener "
           "múltiples Turnos. Todos los turnos duran 1 hora, dentro del horario del consultorio (08:00 a 18:00), común a "
           "todos los profesionales: cada Profesional solo define sus días de atención.</i>",
           "fontSize=12;fontColor=#555555;")
    d.write()


# ---------------------------------------------------------------- Arquitectura lógica
def arquitectura():
    d = Diagram("arquitectura", 1450, 950)
    d.title("Arquitectura Lógica del Sistema", "Sistema Web Integral de Gestión — SANMAR SALUD")

    pres = d.box(36, 98, 1350, 186, "", "")
    d.text(50, 110, 700, 22, "<b>CAPA DE PRESENTACIÓN (Cliente — navegador web)</b>", "fontSize=13;")
    d.box(108, 148, 530, 86,
          "<b>Interfaz Administrador</b><br>Agenda (por día y por profesional), pacientes, historia clínica,<br>"
          "obras sociales y autorizaciones, profesionales, usuarios y panel de indicadores")
    d.box(783, 148, 530, 86,
          "<b>Interfaz Profesional</b><br>Agenda propia, registro de asistencia<br>e historia clínica de sus pacientes")
    d.text(110, 250, 1200, 20,
           "<i>Next.js 15 + React 19 + TypeScript — interfaz responsive (computadora y celular), sin instalación adicional</i>",
           "fontSize=11;fontColor=#555555;")

    app = d.box(36, 358, 1350, 210, "")
    d.text(50, 370, 700, 22, "<b>CAPA DE APLICACIÓN / LÓGICA DE NEGOCIO (Servidor)</b>", "fontSize=13;")
    d.text(830, 370, 545, 20,
           "<i>Next.js Route Handlers (API REST) — desplegado en Vercel, región São Paulo</i>",
           "fontSize=11;fontColor=#555555;align=right;")
    modules = ["Seguridad y Accesos<br>(Auth.js)", "Gestión de<br>Turnos y Agenda", "Gestión de<br>Pacientes",
               "Gestión de<br>Profesionales", "Gestión<br>Clínica", "Gestión de<br>Obras Sociales",
               "Notificaciones", "Dashboard", "Gestión de<br>Usuarios"]
    gap = 14
    w = (1350 - 40 - gap * (len(modules) - 1)) / len(modules)
    for i, name in enumerate(modules):
        d.box(round(56 + i * (w + gap)), 420, round(w), 98, name)

    d.edge(pres, app, label="HTTPS / API REST (JSON)", arrow="block", start_arrow="block",
           exit_=(0.5, 1), entry=(0.5, 0))

    data = d.box(36, 642, 747, 200, "")
    d.text(50, 654, 500, 22, "<b>CAPA DE DATOS</b>", "fontSize=13;")
    d.text(62, 694, 710, 22,
           "Base de datos relacional — <b>PostgreSQL (Neon, São Paulo)</b>, acceso mediante <b>Prisma ORM</b>",
           "fontSize=13;")
    d.text(62, 734, 710, 40,
           "<i>Pacientes · Profesionales · Turnos · Usuarios · Historias Clínicas · Accesos a la Historia Clínica · "
           "Fichas Clínicas · Objetivos de Tratamiento · Obras Sociales · Autorizaciones · Notificaciones</i>",
           "fontSize=11;fontColor=#555555;")
    d.text(62, 790, 710, 22, "<i>Respaldo diario cifrado de la base de datos, conservado 14 días</i>",
           "fontSize=11;fontColor=#555555;")
    d.edge(app, data, label="Prisma (ORM)", arrow="block", exit_=(0.28, 1), entry=(0.5, 0))

    ext = d.box(856, 642, 530, 252, "")
    d.text(870, 654, 400, 22, "<b>SISTEMAS EXTERNOS</b>", "fontSize=13;")
    mail = d.box(880, 690, 482, 48, "Servicio de correo electrónico (Brevo)<br>(notificaciones y recordatorios a pacientes)")
    tasks = d.box(880, 752, 482, 62,
                  "Tareas programadas (GitHub Actions)<br>recordatorios cada hora · monitoreo de disponibilidad cada 15 min<br>"
                  "respaldo diario de la base")
    portal = d.box(880, 828, 482, 44, "Portales de obras sociales (TRADITUM, SAID/APROSS)")
    d.edge(app, mail, label="envío automático", arrow="block", exit_=(0.78, 1), entry=(0.3, 0),
           points=[(1088, 610), (1025, 610)])
    d.edge(tasks, app, arrow="block", exit_=(1, 0.5), entry=(0.985, 1),
           points=[(1408, 783), (1408, 600), (1366, 600)])
    d.edge(tasks, data, label="respaldo diario", arrow="block", exit_=(0, 0.5), entry=(1, 0.7))
    d.edge(app, portal, dashed=True, arrow="block", exit_=(0.95, 1), entry=(1, 0.5),
           points=[(1318, 585), (1428, 585), (1428, 850)])
    d.text(38, 912, 1350, 20,
           "<i>Nota: la línea punteada indica integración manual/asistida (no automatizada). La línea continua indica "
           "integración automática.</i>", "fontSize=11;fontColor=#555555;")
    d.write()


# ---------------------------------------------------------------- Modelo entidad-relación
def der():
    d = Diagram("der", 1420, 1000)
    d.title("Modelo Entidad-Relación (DER)", "Sistema Web Integral de Gestión — SANMAR SALUD", x=20, y=20)
    f = dict(line_h=14, font=11)

    obra, _ = d.uml_class(20, 110, 240, "<b>ObraSocial</b>", [
        "-id : String (PK)", "-nombre : String (único)", "-activo : Boolean", "-observaciones : String"], **f)
    autor, _ = d.uml_class(20, 330, 240, "<b>Autorizacion</b>", [
        "-id : String (PK)", "-pacienteId : String (FK)", "-obraSocialId : String (FK)", "-numero : String",
        "-estado : String", "-sesiones : Integer", "-fechaDesde : Date", "-vencimiento : Date"], **f)
    paciente, _ = d.uml_class(330, 110, 280, "<b>Paciente</b>", [
        "-id : String (PK)", "-nombre : String", "-apellido : String", "-dni : String (único)", "-cuil : String",
        "-fechaNacimiento : Date", "-telefono : String", "-email : String",
        "-obraSocialId : String (FK, opcional)", "-nroAfiliado : String", "-planObraSocial : String",
        "-estado : String", "-ultimoTurno : Date", "-fechaAlta : Date"], attr_min=240, **f)
    turno, _ = d.uml_class(720, 110, 280, "<b>Turno</b>", [
        "-id : String (PK)", "-pacienteId : String (FK)", "-profesionalId : String (FK)",
        "-autorizacionId : String (FK, opcional)", "-fecha : Date", "-hora : Time", "-estado : String",
        "-tipoSesion : String", "-observaciones : String"], **f)
    usuario, _ = d.uml_class(1110, 110, 290, "<b>Usuario</b>", [
        "-id : String (PK)", "-email : String (único)", "-nombre : String", "-contrasenaHash : String",
        "-rol : String", "-activo : Boolean", "-profesionalId : String (FK, único, opcional)",
        "-debeCambiarPassword : Boolean", "-ultimoIngreso : DateTime"], **f)
    profesional, _ = d.uml_class(1110, 400, 290, "<b>Profesional</b>", [
        "-id : String (PK)", "-nombre : String", "-apellido : String", "-matricula : String (única)",
        "-especialidad : String", "-diasAtencion : String[]", "-activo : Boolean"], **f)
    notif, _ = d.uml_class(720, 400, 280, "<b>Notificacion</b>", [
        "-id : String (PK)", "-turnoId : String (FK)", "-tipo : String", "-estado : String",
        "-destinatario : String", "-clave : String (única)", "-intentos : Integer", "-enviadaEn : DateTime"], **f)
    hc, _ = d.uml_class(1110, 640, 290, "<b>HistoriaClinica</b>", [
        "-id : String (PK)", "-pacienteId : String (FK)", "-profesionalId : String (FK)",
        "-turnoId : String (FK, único, opcional)", "-autorNombre : String", "-fecha : Date",
        "-diagnostico : String", "-tratamiento : String", "-evolucion : String"], **f)
    acceso, _ = d.uml_class(20, 640, 240, "<b>AccesoHistoriaClinica</b>", [
        "-id : String (PK)", "-pacienteId : String (FK)", "-usuarioId : String", "-usuarioRol : String",
        "-accion : String", "-fecha : DateTime"], **f)
    ficha, _ = d.uml_class(300, 640, 200, "<b>FichaClinica</b>", [
        "-pacienteId : String (PK, FK)", "-alertas : String", "-antecedentes : String",
        "-actualizadoEn : DateTime"], **f)
    objetivo, _ = d.uml_class(520, 640, 230, "<b>ObjetivoTratamiento</b>", [
        "-id : String (PK)", "-pacienteId : String (FK)", "-descripcion : String", "-cumplido : Boolean"], **f)

    m = dict(font=11)
    d.edge(obra, paciente, src_mult="0..1", tgt_mult="0..*", exit_=(1, 0.5), entry=(0, 0.2), **m)
    d.edge(obra, autor, src_mult="1", tgt_mult="0..*", exit_=(0.5, 1), entry=(0.5, 0), **m)
    d.edge(paciente, autor, src_mult="1", tgt_mult="0..*", exit_=(0, 0.8), entry=(1, 0.3), **m)
    d.edge(paciente, turno, src_mult="1", tgt_mult="0..*", exit_=(1, 0.3), entry=(0, 0.3), **m)
    d.edge(profesional, turno, src_mult="1", tgt_mult="0..*", exit_=(0, 0.2), entry=(1, 0.75),
           points=[(1060, 434), (1060, 270)], **m)
    d.edge(usuario, profesional, src_mult="0..1", tgt_mult="0..1", exit_=(0.5, 1), entry=(0.5, 0), **m)
    d.edge(turno, notif, src_mult="1", tgt_mult="0..*", exit_=(0.5, 1), entry=(0.5, 0), **m)
    d.edge(autor, turno, src_mult="0..1", tgt_mult="0..*", exit_=(0, 0.5), entry=(0.5, 0),
           points=[(8, 410), (8, 88), (860, 88)], **m)
    d.edge(turno, hc, src_mult="0..1", tgt_mult="0..1", exit_=(1, 0.5), entry=(0, 0.15),
           points=[(1040, 220), (1040, 670)], **m)
    d.edge(profesional, hc, src_mult="0..1", tgt_mult="0..*", exit_=(0.5, 1), entry=(0.5, 0), **m)
    d.edge(paciente, hc, src_mult="1", tgt_mult="0..*", exit_=(0.95, 1), entry=(0.5, 1),
           points=[(596, 600), (770, 600), (770, 930), (1255, 930)], **m)
    d.edge(paciente, acceso, src_mult="1", tgt_mult="0..*", exit_=(0.1, 1), entry=(0.5, 0),
           points=[(358, 590), (140, 590)], **m)
    d.edge(paciente, ficha, src_mult="1", tgt_mult="0..1", exit_=(0.4, 1), entry=(0.5, 0),
           points=[(442, 610), (400, 610)], **m)
    d.edge(paciente, objetivo, src_mult="1", tgt_mult="0..*", exit_=(0.75, 1), entry=(0.3, 0),
           points=[(540, 620), (589, 620)], **m)
    d.text(20, 965, 1380, 20,
           "<i>Nota: la multiplicidad se indica en formato UML, en pares, junto a cada extremo de la línea "
           "(convención utilizada en la Figura 3-2-1 del material de estudio).</i>",
           "fontSize=10;fontColor=#555555;align=center;")
    d.write()


# ---------------------------------------------------------------- Casos de uso
# Catálogo de casos de uso por paquete, con numeración jerárquica (árbol y matriz de trazabilidad de la tesis).
CATALOGO = [
    ("Gestión de Turnos y Agenda", ["Crear Turno", "Reprogramar Turno", "Confirmar Turno", "Cancelar Turno",
                                    "Registrar Asistencia", "Eliminar Turno", "Consultar Agenda"]),
    ("Gestión de Pacientes", ["Registrar Paciente", "Actualizar Paciente", "Desactivar Paciente", "Eliminar Paciente",
                              "Buscar Paciente"]),
    ("Gestión de Profesionales", ["Registrar Profesional", "Actualizar Profesional", "Desactivar Profesional",
                                  "Eliminar Profesional"]),
    ("Gestión Clínica", ["Registrar Evolución", "Corregir Evolución", "Consultar Historia Clínica",
                         "Registrar Alertas y Antecedentes", "Gestionar Objetivos de Tratamiento",
                         "Consultar Registro de Accesos"]),
    ("Gestión de Obras Sociales", ["Gestionar Catálogo de Obras Sociales", "Registrar Autorización",
                                   "Consultar Autorizaciones", "Generar Planilla Mensual"]),
    ("Dashboard", ["Visualizar Indicadores", "Resolver Tareas del Día"]),
    ("«Servicio»<br>Seguridad y Accesos", ["Iniciar Sesión", "Cerrar Sesión", "Cambiar Contraseña", "Gestionar Usuarios",
                                           "Consultar Auditoría"]),
    ("«Servicio»<br>Notificaciones", ["Enviar Notificación de Turno", "Enviar Recordatorio de Turno",
                                      "Confirmar o Cancelar desde el Correo"]),
]


def arbol():
    """Dos franjas de cuatro paquetes, para que el árbol entre legible en una hoja vertical."""
    col_w, gap, mid_gap, x0 = 180, 18, 60, 30
    per_band = 4
    width = x0 * 2 + per_band * col_w + (per_band - 2) * gap + mid_gap
    bands = [CATALOGO[:per_band], CATALOGO[per_band:]]
    band_h = [70 + max(len(cus) for _, cus in band) * 58 for band in bands]
    top = 170
    height = top + sum(band_h) + 60 + 40
    d = Diagram("arbol-casos-de-uso", width, height)
    d.title("Árbol de Casos de Uso — Sistema SANMAR SALUD",
            "Casos de uso agrupados por paquete, con numeración jerárquica")
    root = d.box(width / 2 - 130, 90, 260, 40, "<b>Sistema SANMAR SALUD</b>")
    trunk_x = x0 + 2 * col_w + gap + mid_gap / 2

    def col_x(k):
        x = x0 + k * col_w + k * gap
        return x + (mid_gap - gap if k >= 2 else 0)

    y = top
    numero = 0
    for band_index, band in enumerate(bands):
        for k, (paquete, cus) in enumerate(band):
            numero += 1
            x = col_x(k)
            pkg = d.package(x, y, col_w, 52, f"{numero}. {paquete}", "fontSize=11;")
            if band_index == 0:
                d.edge(root, pkg, exit_=(0.5, 1), entry=(0.5, 0))
            else:
                d.edge(root, pkg, exit_=(0.5, 1), entry=(0.5, 0),
                       points=[(trunk_x, 150), (trunk_x, y - 20), (x + col_w / 2, y - 20)])
            prev = pkg
            for j, nombre in enumerate(cus, start=1):
                cu = d.ellipse(x + 4, y + 70 + (j - 1) * 58, col_w - 8, 46, f"{numero}.{j} {nombre}", "fontSize=11;")
                d.line(prev, cu)
                prev = cu
        y += band_h[band_index] + 60
    d.write()


def ambiental():
    d = Diagram("caso-de-uso-ambiental", 1300, 820)
    d.title("Diagrama de Caso de Uso Ambiental — Sistema SANMAR SALUD",
            "Actores directos e indirectos, internos y externos, y otros sistemas")
    sistema = d.ellipse(520, 300, 260, 110, "<b>Sistema de Gestión<br>SANMAR SALUD</b><br>(KineTurnos)", "fontSize=12;")

    admin = d.actor(150, 120, "Administrador")
    d.note(60, 205, 270, 82, "<b>Interno, directo.</b> Gestiona turnos, pacientes, profesionales, obras sociales, "
           "autorizaciones y usuarios; consulta indicadores y la planilla mensual.")
    obras = d.actor(150, 470, "Obras Sociales")
    d.note(60, 555, 270, 68, "<b>Externo, indirecto.</b> Autoriza sesiones y recibe la planilla mensual a través de "
           "la Administración.")
    prof = d.actor(635, 560, "Profesional")
    d.note(515, 645, 270, 68, "<b>Interno, directo.</b> Consulta su agenda, registra la asistencia y la historia "
           "clínica de sus pacientes.")
    paciente = d.actor(1100, 150, "Paciente")
    d.note(990, 330, 270, 82, "<b>Externo.</b> Indirecto: pide turnos al consultorio. Directo: confirma o cancela su "
           "turno desde el enlace del correo, sin usuario ni contraseña.")
    correo = d.box(1040, 500, 170, 50, "«sistema»<br><b>Servicio de Correo</b>")
    d.note(990, 575, 270, 54, "<b>Sistema externo.</b> Entrega los avisos y recordatorios que genera el sistema.")

    d.line(admin, sistema, "gestiona")
    d.line(prof, sistema, "consulta y registra")
    d.line(sistema, correo, "solicita el envío", arrow="open")
    d.edge(correo, paciente, label="entrega avisos<br>y recordatorios", arrow="open", exit_=(1, 0.5), entry=(1, 0.5),
           points=[(1280, 525), (1280, 180)], label_style="labelBackgroundColor=#FFFFFF;")
    d.line(paciente, sistema, "confirma o cancela desde el correo", arrow="open")
    d.line(paciente, admin, "pide turnos", dashed=True)
    d.edge(obras, admin, label="autorizaciones<br>y planilla", dashed=True, exit_=(0, 0.5), entry=(0, 0.5),
           points=[(40, 500), (40, 150)], label_style="labelBackgroundColor=#FFFFFF;")
    d.text(30, 780, 1240, 20, "<i>Línea llena: relación directa con el sistema. Línea punteada: relación indirecta, a "
           "través de otro actor. El nivel técnico Superadmin no se modela como actor.</i>",
           "fontSize=11;fontColor=#555555;")
    d.write()


def paquetes():
    d = Diagram("paquetes", 1300, 840)
    d.title("Modelo de Paquetes — Sistema SANMAR SALUD", "Paquetes de negocio, paquetes de servicio y sus dependencias")
    w, h = 220, 70
    negocio = d.box(40, 100, 1220, 510, "", "dashed=1;strokeColor=#888888;")
    d.text(55, 106, 300, 20, "<b>Paquetes de negocio</b>", "fontSize=12;fontColor=#555555;")
    dashboard = d.package(540, 130, w, h, "Dashboard")
    clinica = d.package(90, 300, w, h, "Gestión Clínica")
    turnos = d.package(540, 300, w, h, "Gestión de Turnos y Agenda")
    obras = d.package(990, 300, w, h, "Gestión de Obras Sociales")
    pacientes = d.package(300, 480, w, h, "Gestión de Pacientes")
    profesionales = d.package(780, 480, w, h, "Gestión de Profesionales")
    notif = d.package(540, 690, w, h, "«Servicio»<br>Notificaciones")
    seguridad = d.package(990, 690, w, h, "«Servicio»<br>Seguridad y Accesos")

    usa = dict(dashed=True, arrow="open", label="«usa»")
    d.line(dashboard, turnos, **usa)
    d.line(dashboard, obras, **usa)
    d.line(clinica, turnos, **usa)
    d.line(clinica, pacientes, **usa)
    d.line(turnos, pacientes, **usa, style="exitX=0.2;exitY=1;")
    d.line(turnos, profesionales, **usa, style="exitX=0.8;exitY=1;")
    d.line(turnos, obras, **usa)
    d.line(turnos, notif, **usa, style="exitX=0.5;exitY=1;entryX=0.5;entryY=0;")
    d.edge(obras, pacientes, label="«usa»", dashed=True, arrow="open", exit_=(0.5, 1), entry=(0.5, 1),
           points=[(1100, 585), (410, 585)], label_style="labelBackgroundColor=#FFFFFF;")
    d.edge(negocio, seguridad, label="«usa»", dashed=True, arrow="open", exit_=(0.87, 1), entry=(0.5, 0),
           label_style="labelBackgroundColor=#FFFFFF;")
    d.text(40, 785, 1220, 40, "<i>Todos los paquetes de negocio usan Seguridad y Accesos (sesión, permisos por perfil "
           "y auditoría). Gestión de Turnos usa Notificaciones para avisar al paciente y Obras Sociales para descontar "
           "la sesión de la autorización.</i>", "fontSize=11;fontColor=#555555;")
    d.write()


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    clases()
    arquitectura()
    der()
    ambiental()
    paquetes()
    arbol()
