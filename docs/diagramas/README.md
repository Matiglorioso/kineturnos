# Diagramas de la tesis (draw.io)

| Diagrama | Archivo editable | Imagen |
|---|---|---|
| Diagrama de clases del paquete Gestión de Turnos y Agenda | `clases-turnos.drawio` | `clases-turnos.png` |
| Arquitectura lógica | `arquitectura.drawio` | `arquitectura.png` |
| Modelo entidad-relación (DER) | `der.drawio` | `der.png` |

Los `.drawio` se abren y editan con draw.io (escritorio o app.diagrams.net). Los PNG también llevan el diagrama incrustado: se pueden abrir directamente en draw.io para editarlos.

## Regenerarlos

`scripts/diagramas/drawio.py` arma los tres `.drawio` a partir del modelo real del sistema:

```bash
npm run diagramas
```

Para exportarlos a PNG con draw.io Desktop, con escala 2 y el diagrama incrustado:

```bash
for n in clases-turnos arquitectura der; do
  "/c/Program Files/draw.io/draw.io.exe" -x -f png -s 2 -b 20 --embed-diagram -o "docs/diagramas/$n.png" "docs/diagramas/$n.drawio"
done
```

Si se edita un diagrama a mano en draw.io, conviene hacer el cambio también en `drawio.py`, para que no se pierda la próxima vez que se regeneren.
