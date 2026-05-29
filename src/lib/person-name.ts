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
