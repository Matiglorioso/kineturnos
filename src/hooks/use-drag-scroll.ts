"use client";

import { useRef } from "react";

/**
 * Fila que se desliza hacia el costado: con el dedo ya funciona (scroll nativo) y con el
 * mouse se arrastra. Un arrastre no cuenta como toque: `wasDrag()` lo dice en el onClick.
 */
export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: false });

  const onPointerDown = (event: React.PointerEvent<T>) => {
    if (event.pointerType !== "mouse" || !ref.current) return;
    drag.current = { active: true, startX: event.clientX, startScroll: ref.current.scrollLeft, moved: false };
  };
  const onPointerMove = (event: React.PointerEvent<T>) => {
    const current = drag.current;
    if (!current.active || !ref.current) return;
    const delta = event.clientX - current.startX;
    if (Math.abs(delta) > 4) current.moved = true;
    ref.current.scrollLeft = current.startScroll - delta;
  };
  const end = () => {
    drag.current.active = false;
    // Deja pasar el click que cierra el arrastre antes de volver a aceptar toques.
    window.setTimeout(() => {
      drag.current.moved = false;
    }, 0);
  };

  return {
    ref,
    handlers: { onPointerDown, onPointerMove, onPointerUp: end, onPointerLeave: end },
    wasDrag: () => drag.current.moved,
  };
}
