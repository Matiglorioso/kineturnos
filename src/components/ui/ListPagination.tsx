"use client";

import { Button } from "@/components/ui/button";
import type { Pagination } from "@/hooks/use-pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getPageNumbers, PAGE_SIZE_OPTIONS } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useId, useRef } from "react";

interface ListPaginationProps {
  /** Lo que devuelve usePagination. */
  pagination: Pick<
    Pagination<unknown>,
    "page" | "pageCount" | "pageSize" | "total" | "from" | "to" | "setPage" | "setPageSize"
  >;
  /** Qué se lista, en plural ("pacientes"), para el texto "1–10 de 57 pacientes". */
  itemLabel: string;
  className?: string;
}

/** Pie de una lista: cuántos se ven, cantidad por página y navegación entre páginas. */
export function ListPagination({ pagination, itemLabel, className }: ListPaginationProps) {
  const { page, pageCount, pageSize, total, from, to, setPage, setPageSize } = pagination;
  const ref = useRef<HTMLElement>(null);
  const sizeLabelId = useId();

  // Con pocos elementos no hay nada que paginar ni elegir.
  if (total <= PAGE_SIZE_OPTIONS[0]) return null;

  const goTo = (next: number) => {
    setPage(next);
    // Lleva al principio de la lista si quedó arriba de la pantalla.
    const list = ref.current?.parentElement;
    if (list && list.getBoundingClientRect().top < 0) {
      list.scrollIntoView({ block: "start" });
    }
  };

  return (
    <nav
      ref={ref}
      aria-label={`Páginas de ${itemLabel}`}
      className={cn(
        "flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between print:hidden",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 sm:justify-start">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {from}–{to} de {total} {itemLabel}
        </p>
        <div className="flex items-center gap-2">
          <span id={sizeLabelId} className="text-sm text-muted-foreground">
            Por página
          </span>
          <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
            <SelectTrigger aria-labelledby={sizeLabelId} className="h-9 w-[4.5rem] px-3">
              <SelectValue>{pageSize}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between gap-1 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9"
            aria-label="Página anterior"
            disabled={page <= 1}
            onClick={() => goTo(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Celular: solo "Página X de Y"; desde sm, los números. */}
          <span className="px-2 text-sm font-medium text-slate-700 sm:hidden">
            Página {page} de {pageCount}
          </span>
          <ol className="hidden items-center gap-1 sm:flex">
            {getPageNumbers(page, pageCount).map((item, index) =>
              item === "…" ? (
                <li key={`gap-${index}`} aria-hidden className="w-6 text-center text-sm text-slate-500">
                  …
                </li>
              ) : (
                <li key={item}>
                  <Button
                    type="button"
                    variant={item === page ? "default" : "ghost"}
                    size="icon"
                    className="h-9 w-9 text-sm"
                    aria-label={`Página ${item}`}
                    aria-current={item === page ? "page" : undefined}
                    onClick={() => item !== page && goTo(item)}
                  >
                    {item}
                  </Button>
                </li>
              )
            )}
          </ol>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9"
            aria-label="Página siguiente"
            disabled={page >= pageCount}
            onClick={() => goTo(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </nav>
  );
}
