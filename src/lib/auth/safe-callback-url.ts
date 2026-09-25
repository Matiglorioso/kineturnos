/** Destino post-login a partir de `?callbackUrl=`. */
export function safeCallbackUrl(value: string | null | undefined): string {
  return value || "/";
}
