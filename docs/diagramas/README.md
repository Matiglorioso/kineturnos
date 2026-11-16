# Diagramas de la tesis (draw.io)

| Diagrama | Archivo editable | Imagen |
|---|---|---|
| Diagrama de clases del paquete Gestión de Turnos y Agenda | `clases-turnos.drawio` | `clases-turnos.png` |
| Arquitectura lógica | `arquitectura.drawio` | `arquitectura.png` |
| Modelo entidad-relación (DER) | `der.drawio` | `der.png` |
| Caso de uso ambiental | `caso-de-uso-ambiental.drawio` | `caso-de-uso-ambiental.png` |
| Modelo de paquetes, con dependencias | `paquetes.drawio` | `paquetes.png` |
| Árbol de casos de uso (numeración jerárquica, mismo catálogo que la matriz de trazabilidad) | `arbol-casos-de-uso.drawio` | `arbol-casos-de-uso.png` |
| Documentación de cada paquete: casos de uso (`paquete-<paquete>-casos`), clases (`paquete-<paquete>-clases`) y colaboración de los casos principales (`colaboracion-<n>-<m>`). Datos en `scripts/diagramas/paquetes_uml.py` | `*.drawio` | `*.png` |

Los `.drawio` se abren y editan con draw.io (escritorio o app.diagrams.net). Los PNG también llevan el diagrama incrustado: se pueden abrir directamente en draw.io para editarlos.

## Regenerarlos

`scripts/diagramas/drawio.py` arma todos los `.drawio` a partir del modelo real del sistema:

```bash
npm run diagramas
```

Para exportarlos a PNG con draw.io Desktop, con escala 2 y el diagrama incrustado:

```bash
for f in docs/diagramas/*.drawio; do
  "/c/Program Files/draw.io/draw.io.exe" -x -f png -s 2 -b 20 --embed-diagram -o "${f%.drawio}.png" "$f"
done
```

Si se edita un diagrama a mano en draw.io, conviene hacer el cambio también en `drawio.py`, para que no se pierda la próxima vez que se regeneren.
