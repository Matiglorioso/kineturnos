"use client";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createInsuranceRequest } from "@/lib/api/insurances-client";
import { ApiError } from "@/lib/api/fetch-json";
import { INSURANCE_NAME_MAX_LENGTH } from "@/lib/insurance";
import type { Insurance } from "@/types";
import { Plus } from "lucide-react";
import { useState } from "react";

const PARTICULAR = "particular";

interface PatientInsuranceFieldsProps {
  insurances: Insurance[];
  insuranceId: string;
  affiliateNumber: string;
  insurancePlan: string;
  onChange: (values: {
    insuranceId: string;
    insurance: string;
    affiliateNumber?: string;
    insurancePlan?: string;
  }) => void;
  onAffiliateNumberChange: (value: string) => void;
  onInsurancePlanChange: (value: string) => void;
  /** Una obra social creada desde acá se suma al catálogo de la página. */
  onInsuranceCreated: (insurance: Insurance) => void;
}

/** Obra social del catálogo (o Particular), con número de afiliado y plan. */
export function PatientInsuranceFields({
  insurances,
  insuranceId,
  affiliateNumber,
  insurancePlan,
  onChange,
  onAffiliateNumberChange,
  onInsurancePlanChange,
  onInsuranceCreated,
}: PatientInsuranceFieldsProps) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Las inactivas no se ofrecen, salvo la que ya tiene el paciente.
  const options = insurances.filter((item) => item.active || item.id === insuranceId);

  const select = (value: string) => {
    if (value === PARTICULAR) {
      onChange({ insuranceId: "", insurance: "", affiliateNumber: "", insurancePlan: "" });
      return;
    }
    const insurance = insurances.find((item) => item.id === value);
    onChange({ insuranceId: value, insurance: insurance?.name ?? "" });
  };

  const create = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const created = await createInsuranceRequest({ name: newName, active: true });
      onInsuranceCreated(created);
      onChange({ insuranceId: created.id, insurance: created.name });
      setAdding(false);
      setNewName("");
    } catch (createError) {
      setError(createError instanceof ApiError ? createError.message : "No se pudo agregar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 sm:col-span-2">
      <FormField id="insuranceId" label="Obra social / prepaga">
        <Select value={insuranceId || PARTICULAR} onValueChange={select}>
          <SelectTrigger id="insuranceId">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={PARTICULAR}>Particular (sin obra social)</SelectItem>
            {options.map((insurance) => (
              <SelectItem key={insurance.id} value={insurance.id}>
                {insurance.name}
                {!insurance.active ? " (inactiva)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!adding ? (
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 text-xs text-brand-700"
            onClick={() => setAdding(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            No está en la lista: agregar una obra social
          </Button>
        ) : (
          <div className="space-y-1.5">
            <div className="flex gap-2">
              <Input
                aria-label="Nombre de la obra social nueva"
                value={newName}
                maxLength={INSURANCE_NAME_MAX_LENGTH}
                onChange={(event) => {
                  setNewName(event.target.value);
                  setError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void create();
                  }
                }}
                placeholder="Por ejemplo: APROSS"
                autoFocus
              />
              <Button type="button" size="sm" className="h-10" disabled={saving || !newName.trim()} onClick={create}>
                Agregar
              </Button>
              <Button type="button" size="sm" variant="ghost" className="h-10" onClick={() => setAdding(false)}>
                Cancelar
              </Button>
            </div>
            {error && (
              <p className="text-xs text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>
        )}
      </FormField>

      {insuranceId && (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="affiliateNumber" label="Nº de afiliado">
            <Input
              id="affiliateNumber"
              value={affiliateNumber}
              onChange={(event) => onAffiliateNumberChange(event.target.value)}
              placeholder="123456/01"
            />
          </FormField>
          <FormField id="insurancePlan" label="Plan">
            <Input
              id="insurancePlan"
              value={insurancePlan}
              onChange={(event) => onInsurancePlanChange(event.target.value)}
              placeholder="SAID, 210, Gold…"
            />
          </FormField>
        </div>
      )}
    </div>
  );
}
