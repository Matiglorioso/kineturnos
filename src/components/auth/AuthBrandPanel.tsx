import { KineMark } from "@/components/brand/KineMark";
import { CLINIC_CLOSING_TIME, CLINIC_OPENING_TIME } from "@/lib/appointment-constants";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

interface AuthBrandPanelProps {
  className?: string;
}

/** Arcos de goniómetro (rango de movimiento), muy sutiles, abajo a la derecha. */
function GoniometerArcs() {
  const radii = [280, 360, 440, 520];
  // Marcas cada 22,5° sobre el arco exterior.
  const ticks = [0, 22.5, 45, 67.5, 90].map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return { x1: -520 * Math.cos(rad), y1: -520 * Math.sin(rad), x2: -500 * Math.cos(rad), y2: -500 * Math.sin(rad) };
  });
  return (
    <svg
      aria-hidden
      viewBox="0 0 620 620"
      fill="none"
      className="pointer-events-none absolute -bottom-36 -right-32 h-[620px] w-[620px]"
    >
      <g transform="translate(560 560)" strokeWidth={1.2}>
        {radii.map((r) => (
          <path
            key={r}
            d={`M${-r} 0 A${r} ${r} 0 0 1 0 ${-r}`}
            stroke={r === 280 ? "rgba(255,255,255,.16)" : "rgba(255,255,255,.10)"}
          />
        ))}
        {ticks.map((tick) => (
          <line key={tick.x1} {...tick} stroke="rgba(255,255,255,.18)" />
        ))}
        <line x1={0} y1={0} x2={-494} y2={-162} stroke="rgba(192,218,180,.35)" strokeWidth={1.5} />
        <circle cx={0} cy={0} r={5} fill="rgba(192,218,180,.35)" />
      </g>
    </svg>
  );
}

/**
 * Panel izquierdo del acceso (computadora): la entrada institucional del consultorio.
 * Solo información real: el nombre, qué es y el horario de atención.
 */
export function AuthBrandPanel({ className }: AuthBrandPanelProps) {
  return (
    <aside
      className={cn(
        "relative hidden h-[100dvh] min-w-0 overflow-hidden bg-[#1b3b2b] text-white lg:flex",
        className
      )}
    >
      <GoniometerArcs />

      <div className="relative z-[1] flex h-full w-full flex-col px-11 py-9">
        <header>
          <p className="text-[26px] font-extrabold tracking-[0.06em]">{siteConfig.clinicName}</p>
          <p className="mt-1 text-[13px] font-medium text-brand-100/90">Consultorio kinesiológico</p>
        </header>

        {/* Franja inferior: tapa los arcos para que el texto quede limpio. */}
        <footer className="mt-auto flex items-end justify-between gap-6 border-t border-white/20 bg-[#1b3b2b] pt-5 shadow-[0_36px_0_36px_#1b3b2b]">
          <div>
            <p className="text-xs text-brand-100/80">Horario de atención</p>
            <p className="mt-0.5 text-[15px] font-semibold">
              Lunes a Sábados de {CLINIC_OPENING_TIME} a {CLINIC_CLOSING_TIME} hs.
            </p>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-brand-100/80">
            <KineMark className="h-4 w-4" withJoint={false} />
            {siteConfig.name}
          </p>
        </footer>
      </div>
    </aside>
  );
}
