import { useRef } from "react";

// 3D perspective tilt on mouse move. Applied to the element directly (no React state),
// so it runs at native speed without triggering re-renders.
export function useTilt<T extends HTMLElement>(strength = 7) {
  const ref = useRef<T>(null);

  function onPointerMove(e: React.PointerEvent) {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transition = "transform 0.08s linear";
    el.style.transform = `perspective(500px) rotateY(${(x * strength).toFixed(2)}deg) rotateX(${(-y * strength).toFixed(2)}deg) translateZ(6px)`;
  }

  function onPointerLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.transition = "transform 0.65s cubic-bezier(0.2, 0.8, 0.2, 1)";
    el.style.transform = "";
  }

  return { ref, onPointerMove, onPointerLeave };
}
