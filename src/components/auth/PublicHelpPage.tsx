"use client";

import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { Button } from "@/components/ui/button";
import {
  getSupportMailto,
  publicHelpFaqs,
  publicHelpIntro,
} from "@/data/public-help";
import { siteConfig } from "@/lib/site-config";
import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";

export function PublicHelpPage() {
  return (
    <AuthPageShell className="items-start lg:items-center" contentMaxWidth="2xl">
      <div className="w-full space-y-6 sm:space-y-8">
        <div className="text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
            {siteConfig.clinicName}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
            {publicHelpIntro.title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {publicHelpIntro.description}
          </p>
        </div>

        <div className="space-y-3">
          {publicHelpFaqs.map((item) => (
            <article
              key={item.question}
              className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5"
            >
              <h2 className="text-sm font-semibold text-slate-900 sm:text-base">
                {item.question}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.answer}
              </p>
            </article>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="w-full sm:flex-1">
            <Link href="/login">
              <ArrowLeft className="h-4 w-4" />
              Volver al login
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full sm:flex-1">
            <a href={getSupportMailto()}>
              <Mail className="h-4 w-4" />
              Escribir a soporte
            </a>
          </Button>
        </div>
      </div>
    </AuthPageShell>
  );
}
