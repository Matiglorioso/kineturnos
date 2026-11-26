"use client";

import { useEffect, useState } from "react";

/** Pantalla de computadora (lg, 1024 px o más). En el celular algunas vistas se arman distinto. */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return isDesktop;
}
