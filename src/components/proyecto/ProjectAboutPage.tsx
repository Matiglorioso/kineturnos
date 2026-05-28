"use client";

import { Badge } from "@/components/ui/badge";
import {
  demoLimitations,
  mainFeatures,
  problemSolution,
  projectMeta,
  roadmap,
  sectionNav,
  technicalDecisions,
  technologies,
} from "@/data/project-about";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  CheckCircle2,
  Code2,
  Layers,
  Lightbulb,
  Rocket,
  Sparkles,
  Target,
} from "lucide-react";
import Link from "next/link";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
      {children}
    </p>
  );
}

function SectionCard({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-24 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-card sm:p-8",
        className
      )}
    >
      {children}
    </section>
  );
}

export function ProjectAboutPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 pb-12">
      {/* Hero */}
      <header className="relative overflow-hidden rounded-3xl border border-brand-100/80 bg-gradient-to-br from-brand-50 via-white to-slate-50 p-8 shadow-elevated sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-200/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-teal-100/40 blur-3xl"
        />

        <div className="relative space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-brand-600 text-white hover:bg-brand-600">
              Case study
            </Badge>
            <Badge variant="outline" className="border-brand-200 text-brand-700">
              {projectMeta.version}
            </Badge>
            <Badge variant="outline" className="border-slate-200 text-slate-600">
              Portfolio · {projectMeta.year}
            </Badge>
          </div>

          <div>
            <p className="text-sm font-medium text-brand-600">Acerca del proyecto</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              {projectMeta.title}
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-slate-600 sm:text-xl">
              {projectMeta.tagline}
            </p>
          </div>

          <p className="max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Proyecto front-end full-stack orientado a consultorios de kinesiologia.
            Esta pagina resume el contexto, las decisiones y el alcance de la demo para
            evaluar el producto sin una demo en vivo.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/agenda"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
            >
              Explorar la app
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Ver funcionalidades
            </a>
          </div>
        </div>
      </header>

      {/* Nav anclas */}
      <nav
        aria-label="Secciones del proyecto"
        className="sticky top-20 z-10 -mx-1 hidden overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-sm backdrop-blur-md lg:flex"
      >
        {sectionNav.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="shrink-0 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
          >
            {item.label}
          </a>
        ))}
      </nav>

      {/* Que es */}
      <SectionCard id="overview">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="space-y-4">
            <div>
              <SectionLabel>Que es</SectionLabel>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                Un sistema de turnos pensado para kinesiologia
              </h2>
            </div>
            <p className="text-slate-600 leading-relaxed">
              <strong className="font-medium text-slate-800">KineTurnos</strong> es
              una aplicacion web de gestion operativa para consultorios
              kinesiologicos. Permite registrar pacientes y profesionales, programar
              sesiones con tipos y estados, y visualizar la carga del dia desde un
              panel central.
            </p>
            <p className="text-slate-600 leading-relaxed">
              La version actual es una <strong className="font-medium text-slate-800">demo funcional</strong>{" "}
              construida como producto navegable: prioriza UX, validaciones de negocio
              y arquitectura clara por modulos, lista para evolucionar hacia backend y
              autenticacion.
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Problema / Solucion */}
      <div id="problem" className="scroll-mt-24 grid gap-6 md:grid-cols-2">
        <SectionCard id="problem-card" className="border-amber-100/80 bg-gradient-to-b from-amber-50/40 to-white">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <Target className="h-5 w-5" />
          </div>
          <SectionLabel>{problemSolution.problem.title}</SectionLabel>
          <h2 className="mt-1 text-xl font-bold text-slate-900">
            Friccion en la coordinacion diaria
          </h2>
          <div className="mt-4 space-y-3">
            {problemSolution.problem.paragraphs.map((text) => (
              <p key={text.slice(0, 24)} className="text-sm leading-relaxed text-slate-600">
                {text}
              </p>
            ))}
          </div>
        </SectionCard>

        <SectionCard className="border-brand-100/80 bg-gradient-to-b from-brand-50/50 to-white">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
            <Lightbulb className="h-5 w-5" />
          </div>
          <SectionLabel>{problemSolution.solution.title}</SectionLabel>
          <h2 className="mt-1 text-xl font-bold text-slate-900">
            Una sola fuente de verdad
          </h2>
          <div className="mt-4 space-y-3">
            {problemSolution.solution.paragraphs.map((text) => (
              <p key={text.slice(0, 24)} className="text-sm leading-relaxed text-slate-600">
                {text}
              </p>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Funcionalidades */}
      <SectionCard id="features">
        <SectionLabel>Funcionalidades principales</SectionLabel>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">
          Modulos de la demo
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Cada area del menu lateral corresponde a un flujo completo con datos
          persistidos en el navegador.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {mainFeatures.map((feature) => (
            <article
              key={feature.title}
              className="group rounded-2xl border border-slate-100 bg-slate-50/50 p-5 transition-all hover:border-brand-200 hover:bg-brand-50/30 hover:shadow-soft"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm ring-1 ring-slate-200/80 group-hover:ring-brand-200">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </SectionCard>

      {/* Stack */}
      <SectionCard id="stack">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <Code2 className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <SectionLabel>Tecnologias utilizadas</SectionLabel>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">Stack tecnico</h2>
            <p className="mt-2 text-sm text-slate-600">
              Eleccion orientada a productividad, tipado fuerte y UI accesible sin
              reinventar componentes base.
            </p>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {technologies.map((tech) => (
                <li
                  key={tech.name}
                  className="rounded-xl border border-slate-200/80 bg-white px-4 py-3.5"
                >
                  <p className="font-semibold text-slate-900">{tech.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{tech.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SectionCard>

      {/* Decisiones */}
      <SectionCard id="decisions">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
            <Layers className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <SectionLabel>Decisiones tecnicas</SectionLabel>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              Por que esta construido asi
            </h2>

            <ol className="mt-8 space-y-4">
              {technicalDecisions.map((item, index) => (
                <li
                  key={item.title}
                  className="flex gap-4 rounded-2xl border border-slate-100 bg-muted/20 p-4 sm:p-5"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-slate-900">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                      {item.rationale}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </SectionCard>

      {/* Limitaciones */}
      <SectionCard
        id="limits"
        className="border-amber-200/60 bg-gradient-to-br from-amber-50/80 via-white to-white"
      >
        <SectionLabel>Limitaciones de la version demo</SectionLabel>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">
          Alcance actual (sin backend)
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Transparencia sobre lo que esta fuera de scope a proposito en esta entrega.
        </p>

        <ul className="mt-6 space-y-3">
          {demoLimitations.map((item) => (
            <li
              key={item}
              className="flex gap-3 rounded-xl border border-amber-100/80 bg-white/80 px-4 py-3 text-sm text-slate-700"
            >
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
              {item}
            </li>
          ))}
        </ul>
      </SectionCard>

      {/* Roadmap */}
      <SectionCard id="roadmap">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Rocket className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <SectionLabel>Proximas mejoras</SectionLabel>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">Roadmap</h2>

            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              {roadmap.map((block) => (
                <div
                  key={block.phase}
                  className="rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50/80 to-white p-5"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-brand-600">
                    {block.phase}
                  </p>
                  <ul className="mt-4 space-y-3">
                    {block.items.map((item) => (
                      <li key={item} className="flex gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* CTA final */}
      <div className="rounded-3xl border border-brand-200/60 bg-brand-50/50 px-6 py-8 text-center sm:px-10">
        <p className="text-sm font-medium text-brand-700">Probar la demo</p>
        <p className="mt-2 text-lg font-semibold text-slate-900">
          Navega la app y valida los flujos en menos de cinco minutos
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            Ir al dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/pacientes"
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Ver pacientes
          </Link>
        </div>
      </div>
    </div>
  );
}
