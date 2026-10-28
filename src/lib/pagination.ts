/** Cantidades por página que se pueden elegir en las listas. */
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export const DEFAULT_PAGE_SIZE = 10;

export function isPageSize(value: unknown): value is number {
  return PAGE_SIZE_OPTIONS.some((option) => option === value);
}

export interface PageSlice<T> {
  items: T[];
  /** Página mostrada (1 en adelante), ya acotada al total. */
  page: number;
  pageCount: number;
  total: number;
  /** Posición del primer y el último elemento mostrados (1 en adelante; 0 si no hay). */
  from: number;
  to: number;
}

/** Recorta la página pedida; si quedó fuera de rango (se borró o filtró algo), muestra la última. */
export function paginate<T>(items: readonly T[], page: number, pageSize: number): PageSlice<T> {
  const total = items.length;
  const size = Math.max(1, Math.floor(pageSize));
  const pageCount = Math.max(1, Math.ceil(total / size));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
  const start = (current - 1) * size;
  const pageItems = items.slice(start, start + size);
  return {
    items: pageItems,
    page: current,
    pageCount,
    total,
    from: total === 0 ? 0 : start + 1,
    to: start + pageItems.length,
  };
}

/**
 * Números de página a mostrar: la primera, la última y las vecinas de la actual,
 * con "…" en los saltos. Ej.: página 6 de 12 → 1 … 5 6 7 … 12.
 */
export function getPageNumbers(page: number, pageCount: number): (number | "…")[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  const pages = new Set([1, pageCount, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((n) => pages.add(n));
  if (page >= pageCount - 2) [pageCount - 3, pageCount - 2, pageCount - 1].forEach((n) => pages.add(n));
  const sorted = [...pages].filter((n) => n >= 1 && n <= pageCount).sort((a, b) => a - b);
  const result: (number | "…")[] = [];
  sorted.forEach((n, index) => {
    if (index > 0 && n - sorted[index - 1] > 1) result.push("…");
    result.push(n);
  });
  return result;
}
