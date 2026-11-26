import { cn } from "@/lib/utils";

/**
 * Isotipo de KineTurnos: una K cuya pierna es una curva que se extiende y termina en
 * un punto, como una articulación que recupera su recorrido. Usa `currentColor`.
 */
export function KineMark({ className, withJoint = true }: { className?: string; withJoint?: boolean }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={4.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5", className)}
      aria-hidden
    >
      <path d="M14 8v32" />
      <path d="M34 8 14 26" />
      <path d="M20 21c6 2 11 8 13 15" />
      {withJoint && <circle cx="34" cy="38" r="2.6" fill="currentColor" stroke="none" />}
    </svg>
  );
}
