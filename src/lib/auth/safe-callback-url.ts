const FALLBACK = "/";
const INTERNAL_ORIGIN = "http://kineturnos.local";

/** Los navegadores tratan "\" como "/" y descartan tabs/saltos de línea al resolver URLs. */
function hasAmbiguousChars(value: string): boolean {
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (char === "\\" || code < 0x20 || code === 0x7f) return true;
  }
  return false;
}

/**
 * Destino post-login a partir de `?callbackUrl=`: solo rutas internas.
 * Cualquier URL absoluta, protocol-relative (`//host`) o ambigua vuelve al inicio.
 */
export function safeCallbackUrl(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return FALLBACK;
  }

  if (hasAmbiguousChars(value)) return FALLBACK;

  try {
    if (new URL(value, INTERNAL_ORIGIN).origin !== INTERNAL_ORIGIN) {
      return FALLBACK;
    }
  } catch {
    return FALLBACK;
  }

  return value;
}
