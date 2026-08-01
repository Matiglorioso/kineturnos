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

/** Title Case para nombres propios (ej. "juan PÉREZ" → "Juan Pérez"). */
export function toTitleCaseName(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("es-AR")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (word.includes("-")) {
        return word
          .split("-")
          .map((part) =>
            part
              ? part.charAt(0).toLocaleUpperCase("es-AR") + part.slice(1)
              : part
          )
          .join("-");
      }
      return word.charAt(0).toLocaleUpperCase("es-AR") + word.slice(1);
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
