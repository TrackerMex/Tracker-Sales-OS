import { useState, useEffect } from 'react'
import { useAppStore } from '@/shared/store/app.store'
import { UserRole } from '@/core/domain/types/common.types'
import { useSettings } from '../../application/hooks/useSettings'
import { useUpdateSettings } from '../../application/hooks/useUpdateSettings'
import { useApiFormErrors } from '@/shared/lib/api-errors'
import { FormErrorSummary } from '@/shared/components/forms/FormErrorSummary'
import { FieldError, fieldErrorProps } from '@/shared/components/forms/FieldError'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const FIELD_LABELS: Record<string, string> = {
  dailyMinPoints: 'Puntos mínimos diarios',
  dailyCallsGoal: 'Meta diaria de llamadas',
  monthlyAmountGoal: 'Meta mensual de monto ($)',
  monthlyUnitGoal: 'Meta mensual de unidades',
  sellerMonthlyAmountGoal: 'Meta mensual por vendedor ($)',
  stalledAmberDays: 'Días ámbar (deals estancados)',
  stalledRedDays: 'Días rojo (deals estancados)',
  coldAccountDays: 'Días sin contacto para cuenta fría',
}

const SETTINGS_GROUPS = [
  {
    value: 'daily',
    label: 'Metas diarias',
    fields: ['dailyMinPoints', 'dailyCallsGoal'],
  },
  {
    value: 'monthly',
    label: 'Metas mensuales',
    fields: ['monthlyAmountGoal', 'monthlyUnitGoal', 'sellerMonthlyAmountGoal'],
  },
  {
    value: 'risk',
    label: 'Riesgo y cartera',
    fields: ['stalledAmberDays', 'stalledRedDays', 'coldAccountDays'],
  },
] as const

export function SettingsPage() {
  const currentUser = useAppStore((s) => s.currentUser)
  const isAdmin = currentUser?.role === UserRole.Admin
  const { data, isLoading } = useSettings()
  const { mutate, isPending, isSuccess, error } = useUpdateSettings()
  const { summary: errorSummary, fieldErrors, clearField, formRef } = useApiFormErrors(error)

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
    if (data) setForm(data)
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
      <div style={{ maxWidth: 560 }}>
        <p style={{ fontSize: 13, color: '#94A3B8' }}>Cargando configuración...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 560 }} className="space-y-5">
      <h1 style={{ fontSize: 18, fontWeight: 700, color: '#002B49' }}>Configuración</h1>

      <form ref={formRef} onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Metas del sistema</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
          <FormErrorSummary error={errorSummary} />

          <Accordion type="multiple" defaultValue={['daily', 'monthly', 'risk']}>
            {SETTINGS_GROUPS.map((group) => (
              <AccordionItem key={group.value} value={group.value}>
                <AccordionTrigger>{group.label}</AccordionTrigger>
                <AccordionContent className="grid gap-3">
                  {group.fields.map((field) => (
                    <div key={field}>
                      <label className="slabel mb-1 block">{FIELD_LABELS[field]}</label>
                      <Input
                        type="number"
                        value={form[field] || ''}
                        onChange={(e) => handleChange(field, e.target.value)}
                        disabled={!isAdmin}
                        min={['dailyMinPoints', 'dailyCallsGoal', 'stalledAmberDays', 'stalledRedDays', 'coldAccountDays'].includes(field) ? 1 : 0}
                        style={!isAdmin ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                        {...fieldErrorProps(field, fieldErrors[field])}
                      />
                      <FieldError name={field} message={fieldErrors[field]} />
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {!isAdmin && (
            <p style={{ fontSize: 12, color: '#94A3B8' }}>Solo los administradores pueden modificar la configuración.</p>
          )}

          {isAdmin && (
            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Guardando...' : 'Guardar'}
              </Button>
              {isSuccess && (
                <span style={{ fontSize: 13, fontWeight: 500, color: '#16A34A' }}>
                  Configuración guardada
                </span>
              )}
            </div>
          )}
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
