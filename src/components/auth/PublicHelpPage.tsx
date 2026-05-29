"use client";

import { Logo } from "@/components/brand/Logo";
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
    <div className="min-h-screen gradient-subtle px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
          <Logo size="lg" />
          <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-brand-600">
            {siteConfig.clinicName}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            {publicHelpIntro.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {publicHelpIntro.description}
          </p>
        </div>

        <div className="space-y-3">
          {publicHelpFaqs.map((item) => (
            <article
              key={item.question}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
            >
              <h2 className="font-semibold text-slate-900">{item.question}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.answer}
              </p>
            </article>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="sm:flex-1">
            <Link href="/login">
              <ArrowLeft className="h-4 w-4" />
              Volver al login
            </Link>
          </Button>
          <Button variant="outline" asChild className="sm:flex-1">
            <a href={getSupportMailto()}>
              <Mail className="h-4 w-4" />
              Escribir a soporte
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
