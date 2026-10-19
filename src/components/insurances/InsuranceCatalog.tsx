"use client";

import { InsuranceDialog } from "@/components/insurances/InsuranceDialog";
import { Button } from "@/components/ui/button";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import {
  DataTable,
  DataTableCell,
  DataTableRow,
} from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  createInsuranceRequest,
  deleteInsuranceRequest,
  updateInsuranceRequest,
  type InsuranceRequest,
} from "@/lib/api/insurances-client";
import { ApiError } from "@/lib/api/fetch-json";
import { pluralize } from "@/lib/pluralize";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { Insurance } from "@/types";
import { Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";

interface InsuranceCatalogProps {
  insurances: Insurance[];
  onChange: () => Promise<void>;
}

/** Catálogo de obras sociales: alta, edición, desactivar y borrar las que no se usan. */
export function InsuranceCatalog({
  insurances,
  onChange,
}: InsuranceCatalogProps) {
  const [dialog, setDialog] = useState<{
    open: boolean;
    insurance: Insurance | null;
  }>({
    open: false,
    insurance: null,
  });
  const [toDelete, setToDelete] = useState<Insurance | null>(null);

  const save = async (body: InsuranceRequest) => {
    if (dialog.insurance) {
      await updateInsuranceRequest(dialog.insurance.id, body);
      showSuccessToast("Obra social actualizada");
    } else {
      await createInsuranceRequest(body);
      showSuccessToast("Obra social agregada");
    }
    await onChange();
  };

  const remove = async () => {
    if (!toDelete) return;
    try {
      await deleteInsuranceRequest(toDelete.id);
      showSuccessToast("Obra social eliminada");
      await onChange();
    } catch (error) {
      showErrorToast(
        "No se pudo eliminar",
        error instanceof ApiError ? error.message : undefined,
      );
    } finally {
      setToDelete(null);
    }
  };

  const iconButton = (
    label: string,
    onClick: () => void,
    icon: React.ReactNode,
    danger = false,
  ) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={label}
          onClick={onClick}
          className={cn(
            "h-9 w-9 text-slate-600",
            danger ? "hover:text-destructive" : "hover:text-brand-700",
          )}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {pluralize(insurances.length, "obra social", "obras sociales")}. Las
          inactivas no se ofrecen al cargar un paciente.
        </p>
        <Button
          type="button"
          onClick={() => setDialog({ open: true, insurance: null })}
        >
          <Plus className="h-4 w-4" />
          Nueva obra social
        </Button>
      </div>

      {insurances.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Todavía no hay obras sociales"
          description="Agregá las obras sociales y prepagas con las que trabaja el consultorio."
        />
      ) : (
        <>
          <div className="hidden md:block">
            <TooltipProvider delayDuration={200}>
              <DataTable
                headers={["Obra social", "Pacientes", "Estado", "Acciones"]}
              >
                {insurances.map((insurance) => (
                  <DataTableRow key={insurance.id}>
                    <DataTableCell>
                      <p className="font-medium text-slate-900">
                        {insurance.name}
                      </p>
                      {insurance.notes && (
                        <p className="max-w-md truncate text-xs text-muted-foreground">
                          {insurance.notes}
                        </p>
                      )}
                    </DataTableCell>
                    <DataTableCell className="text-slate-600">
                      {insurance.patientCount}
                    </DataTableCell>
                    <DataTableCell>
                      <span
                        className={cn(
                          "rounded-lg px-2 py-0.5 text-xs font-medium",
                          insurance.active
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-slate-100 text-slate-600",
                        )}
                      >
                        {insurance.active ? "Activa" : "Inactiva"}
                      </span>
                    </DataTableCell>
                    <DataTableCell>
                      <div className="flex items-center gap-1">
                        {iconButton(
                          "Editar",
                          () => setDialog({ open: true, insurance }),
                          <Pencil className="h-4 w-4" />,
                        )}
                        {insurance.patientCount === 0 &&
                          iconButton(
                            "Eliminar",
                            () => setToDelete(insurance),
                            <Trash2 className="h-4 w-4" />,
                            true,
                          )}
                      </div>
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTable>
            </TooltipProvider>
          </div>

          {/* Celular: tarjetas. */}
          <ul className="grid gap-3 md:hidden" aria-label="Obras sociales">
            {insurances.map((insurance) => (
              <li key={insurance.id} className="surface-card space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-900">
                    {insurance.name}
                  </p>
                  <span
                    className={cn(
                      "shrink-0 rounded-lg px-2 py-0.5 text-xs font-medium",
                      insurance.active
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-slate-100 text-slate-600",
                    )}
                  >
                    {insurance.active ? "Activa" : "Inactiva"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {pluralize(insurance.patientCount, "paciente")}
                </p>
                {insurance.notes && (
                  <p className="text-xs text-muted-foreground">
                    {insurance.notes}
                  </p>
                )}
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setDialog({ open: true, insurance })}
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Button>
                  {insurance.patientCount === 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 text-destructive"
                      onClick={() => setToDelete(insurance)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <InsuranceDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((current) => ({ ...current, open }))}
        insurance={dialog.insurance}
        onSubmit={save}
      />
      <ConfirmAlertDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={`¿Eliminar ${toDelete?.name ?? "la obra social"}?`}
        description="Se borra del catálogo. Si tiene autorizaciones cargadas, no se puede eliminar: desactivala."
        confirmLabel="Eliminar"
        onConfirm={() => void remove()}
        destructive
      />
    </div>
  );
}
