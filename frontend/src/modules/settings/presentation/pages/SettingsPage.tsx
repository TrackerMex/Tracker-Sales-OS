import { useState, useEffect } from 'react'
import { useAppStore } from '@/shared/store/app.store'
import { UserRole } from '@/core/domain/types/common.types'
import { useSettings } from '../../application/hooks/useSettings'
import { useUpdateSettings } from '../../application/hooks/useUpdateSettings'
import { useApiFormErrors } from '@/shared/lib/api-errors'
import { FormErrorSummary } from '@/shared/components/forms/FormErrorSummary'
import { FieldError, fieldErrorProps } from '@/shared/components/forms/FieldError'

const FIELD_LABELS: Record<string, string> = {
  dailyMinPoints: 'Puntos mínimos diarios',
  dailyCallsGoal: 'Meta diaria de llamadas',
  monthlyAmountGoal: 'Meta mensual de monto ($)',
  monthlyUnitGoal: 'Meta mensual de unidades',
  sellerMonthlyAmountGoal: 'Meta mensual por vendedor ($)',
}

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
        <div className="card p-5 space-y-4">
          <div className="slabel">Metas del sistema</div>

          <FormErrorSummary error={errorSummary} />

          {(Object.keys(form) as Array<keyof typeof form>).map((field) => (
            <div key={field}>
              <label className="slabel mb-1 block">{FIELD_LABELS[field]}</label>
              <input
                type="number"
                value={form[field]}
                onChange={(e) => handleChange(field, e.target.value)}
                disabled={!isAdmin}
                min={field === 'dailyMinPoints' || field === 'dailyCallsGoal' ? 1 : 0}
                className={fieldErrors[field] ? 'input input-error' : 'input'}
                style={!isAdmin ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                {...fieldErrorProps(field, fieldErrors[field])}
              />
              <FieldError name={field} message={fieldErrors[field]} />
            </div>
          ))}

          {!isAdmin && (
            <p style={{ fontSize: 12, color: '#94A3B8' }}>Solo los administradores pueden modificar la configuración.</p>
          )}

          {isAdmin && (
            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={isPending} className="btn-primary">
                {isPending ? 'Guardando...' : 'Guardar'}
              </button>
              {isSuccess && (
                <span style={{ fontSize: 13, fontWeight: 500, color: '#16A34A' }}>
                  Configuración guardada
                </span>
              )}
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
