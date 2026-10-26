# Disponibilidad (RNF08)

> RNF08 — El sistema debe estar disponible durante las 24 hs del día, independientemente del horario de atención del consultorio.

## Cómo se cumple

- **Sin servidores propios:** la aplicación corre en Vercel (funciones serverless) y la base de datos en Neon (PostgreSQL administrado). No depende de ninguna computadora del consultorio ni de un horario: responde a cualquier hora, desde cualquier dispositivo con internet.
- **Base de datos que se suspende sola:** en el plan gratuito, Neon suspende la base después de unos minutos sin uso y la reactiva en la primera consulta. No es una caída: esa primera consulta tarda 1 a 3 segundos más. El chequeo lo tiene en cuenta (reintenta).
- **Deploy sin cortes:** cada versión nueva se publica en Vercel recién cuando termina de construirse y migrar la base; mientras tanto sigue respondiendo la anterior.

## Monitoreo

El workflow [`disponibilidad.yml`](../.github/workflows/disponibilidad.yml) de GitHub Actions corre **cada 15 minutos** y verifica dos cosas en producción (`APP_URL`):

| Chequeo | URL | Qué demuestra |
|---|---|---|
| App | `/login` | Vercel sirve la aplicación |
| API y base de datos | `/api/health/db` | La API responde y se conecta a PostgreSQL |

- Cada chequeo hace hasta 3 intentos separados por 20 s (por la reactivación de Neon). Si los tres fallan, el workflow termina en rojo y **GitHub manda un correo** a quien administra el repositorio.
- Cada ejecución deja un resumen con el código HTTP y el tiempo de respuesta (pestaña *Actions* → *Disponibilidad*).
- También se puede correr a mano: *Actions* → *Disponibilidad* → *Run workflow*.

> GitHub puede demorar unos minutos las ejecuciones programadas en horarios de mucha carga, y desactiva los workflows programados de un repositorio sin actividad durante 60 días (se reactivan con un clic).

## Informe

El historial de chequeos se resume con:

```bash
npm run disponibilidad                 # últimos 30 días
npm run disponibilidad -- --dias 7
npm run disponibilidad -- --desde 2026-10-27
```

Necesita el CLI `gh` autenticado. Ejemplo de salida:

```
Disponibilidad de producción desde 27/10/26, 00:00
  Chequeos: 2880 (cada 15 minutos)
  Exitosos: 2879
  Fallidos: 1
  Disponibilidad: 99.97 %
  Fallas:
    - 03/11/26, 04:15
```

Solo cuenta los chequeos programados (no los manuales), así el porcentaje refleja un muestreo parejo a lo largo del día y de la noche.
