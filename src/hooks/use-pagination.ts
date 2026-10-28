"use client";

import { DEFAULT_PAGE_SIZE, isPageSize, paginate } from "@/lib/pagination";
import { useEffect, useMemo, useState } from "react";

interface UsePaginationOptions {
  /** Identifica la lista para recordar la cantidad por página elegida en este navegador. */
  storageKey: string;
  /** Cuando cambia (búsqueda, filtros, orden), vuelve a la primera página. */
  resetKey?: string;
}

const storageName = (key: string) => `kineturnos:por-pagina:${key}`;

/** Paginación del lado del cliente sobre una lista ya cargada (y filtrada). */
export function usePagination<T>(items: readonly T[], { storageKey, resetKey = "" }: UsePaginationOptions) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);

  // Se lee después de montar para no desalinear el HTML del servidor.
  useEffect(() => {
    try {
      const saved = Number(window.localStorage.getItem(storageName(storageKey)));
      if (isPageSize(saved)) setPageSizeState(saved);
    } catch {
      // Sin almacenamiento (modo privado, bloqueado): queda el valor por defecto.
    }
  }, [storageKey]);

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  const setPageSize = (size: number) => {
    if (!isPageSize(size)) return;
    setPageSizeState(size);
    setPage(1);
    try {
      window.localStorage.setItem(storageName(storageKey), String(size));
    } catch {
      // Ídem: no se recuerda, pero la lista funciona igual.
    }
  };

  const slice = useMemo(() => paginate(items, page, pageSize), [items, page, pageSize]);

  return { ...slice, pageSize, setPage, setPageSize };
}

export type Pagination<T> = ReturnType<typeof usePagination<T>>;
