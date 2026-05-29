"use client";

import { Badge } from "@/components/ui/badge";
import {
  appointmentStatuses,
  helpIntro,
  helpMeta,
  helpSectionNav,
  moduleGuides,
  quickStartSteps,
  supportInfo,
  systemScope,
} from "@/data/help-content";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleHelp,
  LifeBuoy,
  ListChecks,
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
      <header className="relative overflow-hidden rounded-3xl border border-brand-100/80 bg-gradient-to-br from-brand-50 via-white to-slate-50 p-8 shadow-elevated sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-200/30 blur-3xl"
        />
        <div className="relative space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-brand-600 text-white hover:bg-brand-600">
              Ayuda
            </Badge>
            <Badge variant="outline" className="border-brand-200 text-brand-700">
              {helpMeta.productName} {helpMeta.version}
            </Badge>
            <Badge variant="outline" className="border-slate-200 text-slate-600">
              {helpMeta.clinicName}
            </Badge>
          </div>

          <div>
            <p className="text-sm font-medium text-brand-600">{helpIntro.title}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {helpMeta.productName}
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-slate-600">
              Sistema de gestión para {helpMeta.clinicName}
            </p>
          </div>

          <p className="max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
            {helpIntro.description}
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/agenda"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
            >
              Ir a la agenda
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#inicio-rapido"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Primeros pasos
            </a>
          </div>
        </div>
      </header>

      <nav
        aria-label="Secciones de ayuda"
        className="sticky top-20 z-10 -mx-1 hidden overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-sm backdrop-blur-md lg:flex"
      >
        {helpSectionNav.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="shrink-0 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
          >
            {item.label}
          </a>
        ))}
      </nav>

      <SectionCard id="inicio">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <CircleHelp className="h-6 w-6" />
          </div>
          <div className="space-y-3">
            <SectionLabel>Qué es</SectionLabel>
            <h2 className="text-2xl font-bold text-slate-900">
              Gestión diaria del consultorio
            </h2>
            <p className="leading-relaxed text-slate-600">
              <strong className="font-medium text-slate-800">KineTurnos</strong>{" "}
              organiza turnos, pacientes y profesionales en un solo lugar. Está
              pensado para recepción y kinesiólogos que necesitan coordinar
              sesiones, estados y disponibilidad sin planillas ni mensajes
              dispersos.
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard id="inicio-rapido">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <ListChecks className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <SectionLabel>Primeros pasos</SectionLabel>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              Cómo empezar
            </h2>
            <ol className="mt-6 space-y-3">
              {quickStartSteps.map((step, index) => (
                <li
                  key={step}
                  className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-sm text-slate-700"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </SectionCard>

      <SectionCard id="modulos">
        <SectionLabel>Módulos</SectionLabel>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">
          Qué hace cada sección
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {moduleGuides.map((module) => (
            <article
              key={module.title}
              className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm ring-1 ring-slate-200/80">
                <module.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{module.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {module.summary}
              </p>
              <ul className="mt-4 space-y-2">
                {module.tips.map((tip) => (
                  <li
                    key={tip}
                    className="flex gap-2 text-xs leading-relaxed text-slate-600 sm:text-sm"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {tip}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard id="estados">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <SectionLabel>Estados del turno</SectionLabel>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              Significado de cada estado
            </h2>
            <ul className="mt-6 space-y-3">
              {appointmentStatuses.map((status) => (
                <li
                  key={status.name}
                  className="rounded-xl border border-slate-100 bg-white px-4 py-3"
                >
                  <p className="font-medium text-slate-900">{status.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{status.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SectionCard>

      <SectionCard id="alcance">
        <SectionLabel>Alcance del sistema</SectionLabel>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">
          Qué incluye esta versión
        </h2>
        <ul className="mt-6 space-y-3">
          {systemScope.map((item) => (
            <li
              key={item}
              className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-sm text-slate-700"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              {item}
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard id="soporte" className="border-brand-100/80 bg-brand-50/30">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
            <LifeBuoy className="h-6 w-6" />
          </div>
          <div>
            <SectionLabel>{supportInfo.title}</SectionLabel>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              ¿Necesitás ayuda?
            </h2>
            <div className="mt-4 space-y-2">
              {supportInfo.lines.map((line) => (
                <p key={line} className="text-sm leading-relaxed text-slate-600">
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
