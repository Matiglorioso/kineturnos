"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="top-right"
      closeButton
      richColors={false}
      toastOptions={{
        classNames: {
          toast:
            "group toast !rounded-xl !border !shadow-lg !font-sans !gap-3",
          title: "!text-sm !font-semibold",
          description: "!text-sm !opacity-90",
          closeButton:
            "!border-slate-200 !bg-white/80 !text-slate-500 hover:!text-slate-800",
          success:
            "!border-emerald-200/90 !bg-emerald-50/95 !text-emerald-950 [&_[data-description]]:!text-emerald-800/90",
          error:
            "!border-red-200/90 !bg-red-50/95 !text-red-950 [&_[data-description]]:!text-red-800/90",
        },
      }}
      {...props}
    />
  );
}
