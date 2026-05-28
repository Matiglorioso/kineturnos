"use client";

import { useEffect, useState } from "react";

const DEFAULT_EXIT_DELAY_MS = 200;

/** Mantiene la entidad visible al cerrar el dialog (animacion de salida). */
export function useDisplayEntity<T>(entity: T | null, open: boolean) {
  const [displayEntity, setDisplayEntity] = useState<T | null>(null);

  useEffect(() => {
    if (entity) {
      setDisplayEntity(entity);
    }
  }, [entity]);

  useEffect(() => {
    if (!open) {
      const timer = window.setTimeout(() => setDisplayEntity(null), DEFAULT_EXIT_DELAY_MS);
      return () => window.clearTimeout(timer);
    }
  }, [open]);

  const activeEntity = open ? entity : displayEntity;

  return { activeEntity, displayEntity };
}
