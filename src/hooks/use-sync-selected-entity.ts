"use client";

import { useEffect } from "react";

export function useSyncSelectedEntity<T extends { id: string }>({
  items,
  selected,
  detailOpen,
  setSelected,
  setDetailOpen,
}: {
  items: T[];
  selected: T | null;
  detailOpen: boolean;
  setSelected: (item: T | null) => void;
  setDetailOpen: (open: boolean) => void;
}) {
  useEffect(() => {
    if (!detailOpen || !selected) return;

    const updated = items.find((item) => item.id === selected.id);
    if (updated) {
      setSelected(updated);
      return;
    }

    setDetailOpen(false);
    setSelected(null);
  }, [items, selected, detailOpen, setSelected, setDetailOpen]);
}
