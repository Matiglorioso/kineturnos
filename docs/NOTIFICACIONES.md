# Notificaciones por correo (RF05)

El sistema le avisa al paciente por correo:

| Evento | Cuándo |
|---|---|
| Creación | Se agenda un turno (pendiente o confirmado). Incluye fecha, hora, profesional, tipo de sesión y estado. |
| Confirmación | El turno pasa de pendiente a confirmado. |
| Reprogramación | Cambia la fecha, la hora o el profesional. Menciona el horario anterior. |
| Cancelación | El turno se cancela. |
| Recordatorio | 24 h antes del turno (ver abajo). |

Marcar un turno como atendido o ausente, o cambiar solo el tipo de sesión o las observaciones, no manda correo. Si se cambia el paciente de un turno, el anterior recibe la cancelación y el nuevo la creación.

## Cómo funciona

1. Cada escritura de turno guarda en la tabla `notificaciones`, **en la misma transacción**, los correos que corresponden. Si la escritura falla, no queda ningún aviso.
2. Después de responder a la pantalla, el servidor los envía con la API de [Brevo](https://www.brevo.com/). El envío nunca demora ni rompe el alta del turno.
3. Cada hora, un workflow de GitHub Actions (`.github/workflows/recordatorios.yml`) llama a `/api/cron/notificaciones`, que:
   - encola un recordatorio para cada turno pendiente o confirmado que empieza **entre 2 y 24 horas después**. Con la corrida horaria, el recordatorio sale entre 23 y 24 h antes; si el turno se agendó con menos de 24 h de anticipación, sale en la siguiente corrida (salvo que falten menos de 2 h);
   - reintenta los correos que fallaron (hasta 3 intentos).
4. Un turno recibe un solo recordatorio por horario. Si se reprograma, recibe otro para el horario nuevo.

Cada notificación queda registrada con su estado: `pendiente`, `enviando`, `enviada`, `fallida` u `omitida` (paciente sin email, o envío deshabilitado), con el motivo en `error`.

Si el paciente no tiene email cargado, no se envía nada y queda `omitida`.

## Configuración (una sola vez)

### 1. Brevo

1. Crear una cuenta gratuita en brevo.com (hasta 300 correos por día).
2. **Senders, domains & dedicated IPs → Senders → Add a sender**: cargar la casilla del consultorio (por ejemplo un Gmail) y confirmarla desde el correo que llega.
3. **SMTP & API → API keys → Generate a new API key**. Copiarla: se ve una sola vez.

Con un dominio propio conviene además autenticarlo en Brevo (DKIM/DMARC) para que los correos no caigan en spam.

### 2. Vercel (solo en **Production**)

| Variable | Valor |
|---|---|
| `BREVO_API_KEY` | La API key de Brevo (marcar **Sensitive**) |
| `MAIL_FROM_EMAIL` | La casilla verificada como remitente |
| `MAIL_FROM_NAME` | Opcional. Por defecto, `SANMAR SALUD` |
| `MAIL_REPLY_TO` | Opcional. Casilla a la que llegan las respuestas de los pacientes |
| `CRON_SECRET` | Un secreto largo aleatorio (`openssl rand -hex 32`), **Sensitive** |

No cargar `BREVO_API_KEY` en Preview: los previews usan datos de prueba y no deben mandar correos. Para probar en un preview, cargar ahí `BREVO_API_KEY`, `MAIL_FROM_EMAIL` y **`MAIL_TEST_RECIPIENT`** con tu casilla: todos los correos van a esa casilla, con el destinatario original en el asunto.

### 3. GitHub (para el recordatorio horario)

En **Settings → Secrets and variables → Actions** del repo:

- **Secret** `CRON_SECRET`: el mismo valor que en Vercel.
- **Variable** `APP_URL`: `https://kineturnos.vercel.app` (sin `/` al final).

Para probarlo: **Actions → Recordatorios de turnos → Run workflow**. La respuesta muestra cuántos recordatorios encoló y cuántos correos envió, falló u omitió.

## Probar en local

Sin `BREVO_API_KEY` todo funciona igual, pero los correos quedan `omitida` y no sale nada. Para ver correos reales en local, agregar a `.env.local` las variables de Brevo y `MAIL_TEST_RECIPIENT` con tu casilla.

El cron se puede llamar a mano:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/notificaciones
```

## Límites conocidos

- GitHub Actions puede demorar unos minutos las corridas programadas (o, rara vez, saltear una). La ventana de 2 a 24 h cubre una corrida salteada: el recordatorio sale en la siguiente.
- Los correos no se reenvían si se corrige el email del paciente después del aviso.
