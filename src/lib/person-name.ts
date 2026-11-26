/** Separa un nombre completo en nombre de pila y apellido(s). */
export function splitFullName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

/** Partículas que van en minúscula dentro de un nombre ("María de la Fuente", "van der Berg"). */
const NAME_PARTICLES = new Set(["de", "del", "la", "las", "los", "y", "da", "das", "do", "dos", "di", "van", "von", "der", "den"]);

function capitalize(part: string): string {
  return part ? part.charAt(0).toLocaleUpperCase("es-AR") + part.slice(1) : part;
}

/**
 * Title Case para nombres propios (ej. "juan PÉREZ" → "Juan Pérez"), con mayúscula también
 * después de guiones y apóstrofos ("O'Connor") y las partículas en minúscula ("de la Fuente").
 * Una partícula sola queda con mayúscula: puede ser el nombre entero.
 */
export function toTitleCaseName(value: string): string {
  const words = value.trim().toLocaleLowerCase("es-AR").split(/\s+/).filter(Boolean);
  return words
    .map((word) => {
      if (words.length > 1 && NAME_PARTICLES.has(word)) return word;
      return word
        .split(/([-'’])/)
        .map(capitalize)
        .join("");
    })
    .join(" ");
}

export function resolveNameParts(
  fullName: string,
  firstName?: string,
  lastName?: string
): { firstName: string; lastName: string } {
  if (firstName?.trim() && lastName?.trim()) {
    return { firstName: firstName.trim(), lastName: lastName.trim() };
  }

  const split = splitFullName(fullName);

  return {
    firstName: firstName?.trim() || split.firstName,
    lastName: lastName?.trim() || split.lastName,
  };
}
