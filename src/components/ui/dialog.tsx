"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronLeft, X } from "lucide-react";

import { escapeBelongsToOpenList } from "@/lib/escape-key";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

/**
 * Formularios a pantalla completa en el celular (como la ficha del paciente): "‹ Volver"
 * arriba, el título grande y la acción principal fija abajo. El encabezado y el pie lo leen
 * de acá para acomodarse solos.
 */
const FullScreenContext = React.createContext(false);

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const MOBILE_FULL_SCREEN =
  "max-lg:!inset-0 max-lg:!flex max-lg:!h-[100dvh] max-lg:!max-h-[100dvh] max-lg:!w-full max-lg:!max-w-none max-lg:!translate-x-0 max-lg:!translate-y-0 max-lg:!flex-col max-lg:!gap-3 max-lg:!overflow-y-auto max-lg:!rounded-none max-lg:!border-0 max-lg:!px-4 max-lg:!pb-0 max-lg:!pt-[calc(env(safe-area-inset-top)+0.5rem)] max-lg:focus:outline-none max-lg:[&>form]:flex max-lg:[&>form]:flex-1 max-lg:[&>form]:flex-col max-lg:[&_input]:!bg-white max-lg:[&_textarea]:!bg-white max-lg:[&_button[role=combobox]]:!bg-white";

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    /** Sin la ✕ de arriba (la pantalla trae su propio "volver"). */
    hideClose?: boolean;
    /** En el celular, a pantalla completa con "‹ Volver" (formularios). */
    mobileFullScreen?: boolean;
  }
>(({ className, children, onEscapeKeyDown, onOpenAutoFocus, hideClose = false, mobileFullScreen = false, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      onCloseAutoFocus={(event) => event.preventDefault()}
      onOpenAutoFocus={(event) => {
        onOpenAutoFocus?.(event);
        // Celular: no saltar al primer campo (abriría el teclado) ni resaltar "Volver".
        if (!event.defaultPrevented && mobileFullScreen && window.matchMedia("(max-width: 1023px)").matches) {
          event.preventDefault();
          (event.currentTarget as HTMLElement | null)?.focus();
        }
      }}
      onEscapeKeyDown={(event) => {
        // Con la lista de un buscador abierta, Escape cierra la lista y no el diálogo.
        if (escapeBelongsToOpenList(event.target as Element | null)) event.preventDefault();
        onEscapeKeyDown?.(event);
      }}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-[calc(100%-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 rounded-2xl border bg-background p-4 lg:rounded-[10px] shadow-elevated duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:w-full sm:max-w-xl sm:p-6",
        className,
        mobileFullScreen && MOBILE_FULL_SCREEN
      )}
      {...props}
    >
      <FullScreenContext.Provider value={mobileFullScreen}>
        {mobileFullScreen && (
          <DialogPrimitive.Close className="-ml-1 flex h-10 w-fit shrink-0 items-center gap-0.5 rounded-lg px-1 text-[15px] font-semibold text-brand-800 lg:hidden">
            <ChevronLeft className="h-5 w-5" />
            Volver
          </DialogPrimitive.Close>
        )}
        {children}
      </FullScreenContext.Provider>
      {!hideClose && (
        <DialogPrimitive.Close
          className={cn(
            "absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-muted hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none",
            mobileFullScreen && "max-lg:hidden"
          )}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Cerrar</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const fullScreen = React.useContext(FullScreenContext);
  return (
    <div
      className={cn(
        "flex flex-col space-y-1.5 text-center sm:text-left",
        // Celular: título grande a la izquierda, sin el ícono.
        fullScreen &&
          "max-lg:space-y-1 max-lg:text-left max-lg:[&_h2]:text-[22px] max-lg:[&_h2]:font-bold max-lg:[&_h2>span:first-child]:hidden",
        className
      )}
      {...props}
    />
  );
};
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const fullScreen = React.useContext(FullScreenContext);
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [&>button]:w-full sm:[&>button]:w-auto",
        className,
        // Celular: la acción principal fija abajo, a lo ancho (Cancelar = "‹ Volver").
        fullScreen &&
          "max-lg:sticky max-lg:bottom-0 max-lg:z-10 max-lg:-mx-4 max-lg:mt-auto max-lg:flex-row max-lg:border-t max-lg:border-slate-200/80 max-lg:bg-background max-lg:px-4 max-lg:pb-[calc(0.75rem+env(safe-area-inset-bottom))] max-lg:pt-3 max-lg:[&>[data-cancel]]:hidden max-lg:[&>button]:h-12 max-lg:[&>button]:flex-1 max-lg:[&>button]:text-[15px] max-lg:[&>button]:w-auto"
      )}
      {...props}
    />
  );
};
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
