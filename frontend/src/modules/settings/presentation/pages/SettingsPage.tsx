import { useState, useEffect } from "react"
import { useAppStore } from "@/shared/store/app.store"
import { UserRole } from "@/core/domain/types/common.types"
import { useSettings } from "../../application/hooks/useSettings"
import { useUpdateSettings } from "../../application/hooks/useUpdateSettings"
import { useApiFormErrors } from "@/shared/lib/api-errors"
import { FormErrorSummary } from "@/shared/components/forms/FormErrorSummary"
import { FieldError } from "@/shared/components/forms/FieldError"
import { fieldErrorProps } from "@/shared/components/forms/field-error-props"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/shared/components/layout/PageHeader"

const FIELD_LABELS: Record<string, string> = {
  dailyMinPoints: "Puntos mínimos diarios",
  dailyCallsGoal: "Meta diaria de llamadas",
  monthlyAmountGoal: "Meta mensual de monto ($)",
  monthlyUnitGoal: "Meta mensual de unidades",
  sellerMonthlyAmountGoal: "Meta mensual por vendedor ($)",
  stalledAmberDays: "Días ámbar (oportunidades estancadas)",
  stalledRedDays: "Días rojo (oportunidades estancadas)",
  coldAccountDays: "Días sin contacto para cuenta fría",
}

const SETTINGS_GROUPS = [
  {
    value: "daily",
    label: "Metas diarias",
    fields: ["dailyMinPoints", "dailyCallsGoal"],
  },
  {
    value: "monthly",
    label: "Metas mensuales",
    fields: ["monthlyAmountGoal", "monthlyUnitGoal", "sellerMonthlyAmountGoal"],
  },
  {
    value: "risk",
    label: "Riesgo y cartera",
    fields: ["stalledAmberDays", "stalledRedDays", "coldAccountDays"],
  },
] as const

export function SettingsPage() {
  const currentUser = useAppStore((s) => s.currentUser)
  const isAdmin = currentUser?.role === UserRole.Admin
  const { data, isLoading } = useSettings()
  const { mutate, isPending, isSuccess, error } = useUpdateSettings()
  const {
    summary: errorSummary,
    fieldErrors,
    clearField,
    formRef,
  } = useApiFormErrors(error)

  const [form, setForm] = useState({
    dailyMinPoints: 30,
    dailyCallsGoal: 10,
    monthlyAmountGoal: 600000,
    monthlyUnitGoal: 150,
    sellerMonthlyAmountGoal: 150000,
    stalledAmberDays: 7,
    stalledRedDays: 14,
    coldAccountDays: 14,
  })

  useEffect(() => {
    if (!data) return
    const frame = requestAnimationFrame(() => setForm(data))
    return () => cancelAnimationFrame(frame)
  }, [data])

  function handleChange(field: string, value: string) {
    clearField(field)
    setForm((prev) => ({ ...prev, [field]: Number(value) }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutate(form)
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Configuración"
          description="Metas comerciales y umbrales de riesgo"
        />
        <div
          className="grid gap-px border border-border bg-border md:grid-cols-3"
          role="status"
          aria-label="Cargando configuración"
        >
          {SETTINGS_GROUPS.map((group) => (
            <div
              key={group.value}
              className="flex flex-col gap-4 bg-background p-4 md:p-6"
            >
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Configuración"
        description="Metas comerciales y umbrales de riesgo"
      />

      <div className="grid grid-cols-12 gap-px bg-border p-px">
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="col-span-12 bg-background"
        >
          <div className="border-b p-4 md:p-6">
            <h2 className="text-base font-semibold">Metas del sistema</h2>
            {!isAdmin && (
              <p className="mt-1 text-xs text-muted-foreground">
                Solo los administradores pueden modificar la configuración.
              </p>
            )}
          </div>

          {errorSummary && (
            <div className="p-4 pb-0 md:px-6">
              <FormErrorSummary error={errorSummary} />
            </div>
          )}

          <div className="grid gap-px bg-border md:grid-cols-3">
            {SETTINGS_GROUPS.map((group) => (
              <section
                key={group.value}
                className="bg-background p-4 md:p-6"
                aria-labelledby={`settings-${group.value}-title`}
              >
                <h3
                  id={`settings-${group.value}-title`}
                  className="text-base font-semibold"
                >
                  {group.label}
                </h3>
                <div className="mt-6 flex flex-col gap-6">
                  {group.fields.map((field) => (
                    <div key={field}>
                      <Label htmlFor={`settings-${field}`}>
                        {FIELD_LABELS[field]}
                      </Label>
                      <Input
                        id={`settings-${field}`}
                        type="number"
                        className="mt-2"
                        value={form[field] || ""}
                        onChange={(e) => handleChange(field, e.target.value)}
                        disabled={!isAdmin}
                        min={
                          [
                            "dailyMinPoints",
                            "dailyCallsGoal",
                            "stalledAmberDays",
                            "stalledRedDays",
                            "coldAccountDays",
                          ].includes(field)
                            ? 1
                            : 0
                        }
                        {...fieldErrorProps(field, fieldErrors[field])}
                      />
                      <FieldError name={field} message={fieldErrors[field]} />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {isAdmin && (
            <div className="flex flex-wrap items-center justify-end gap-3 border-t p-4 md:px-6">
              {isSuccess && (
                <span role="status" className="text-sm text-status-success">
                  Configuración guardada
                </span>
              )}
              <Button type="submit" size="lg" disabled={isPending}>
                {isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
