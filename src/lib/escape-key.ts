/** Lo mínimo de un elemento del DOM que hace falta para decidir (testeable sin navegador). */
type ClosestTarget = { closest: (selector: string) => unknown } | null | undefined;

/**
 * Escape dentro de un diálogo: si el foco está en un buscador con su lista abierta
 * (role="combobox" aria-expanded="true"), la tecla es para cerrar esa lista, no el
 * diálogo. Radix escucha Escape en el documento antes que el buscador, así que el
 * diálogo tiene que preguntarlo.
 */
export function escapeBelongsToOpenList(target: ClosestTarget): boolean {
  if (!target || typeof target.closest !== "function") return false;
  return Boolean(target.closest('[role="combobox"][aria-expanded="true"]'));
}
