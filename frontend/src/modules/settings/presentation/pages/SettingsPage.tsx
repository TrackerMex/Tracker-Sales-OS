import { useState, useEffect } from 'react'
import { useAppStore } from '@/shared/store/app.store'
import { UserRole } from '@/core/domain/types/common.types'
import { useSettings } from '../../application/hooks/useSettings'
import { useUpdateSettings } from '../../application/hooks/useUpdateSettings'

const FIELD_LABELS: Record<string, string> = {
  dailyMinPoints: 'Puntos mínimos diarios',
  monthlyAmountGoal: 'Meta mensual de monto ($)',
  monthlyUnitGoal: 'Meta mensual de unidades',
  sellerMonthlyAmountGoal: 'Meta mensual por vendedor ($)',
}

export function SettingsPage() {
  const currentUser = useAppStore((s) => s.currentUser)
  const isAdmin = currentUser?.role === UserRole.Admin
  const { data, isLoading } = useSettings()
  const { mutate, isPending, isSuccess } = useUpdateSettings()

  const [form, setForm] = useState({
    dailyMinPoints: 30,
    monthlyAmountGoal: 600000,
    monthlyUnitGoal: 150,
    sellerMonthlyAmountGoal: 150000,
  })

  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: Number(value) }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutate(form)
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <p className="text-sm text-slate-500">Cargando configuración...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h2 className="text-2xl font-black text-[#002B49]">Configuración</h2>

      <form onSubmit={handleSubmit}>
        <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-5">
          <p className="text-sm font-semibold text-slate-700">Metas del sistema</p>

          {(Object.keys(form) as Array<keyof typeof form>).map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {FIELD_LABELS[field]}
              </label>
              <input
                type="number"
                value={form[field]}
                onChange={(e) => handleChange(field, e.target.value)}
                disabled={!isAdmin}
                min={field === 'dailyMinPoints' ? 1 : 0}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#002B49]/20"
              />
            </div>
          ))}

          {!isAdmin && (
            <p className="text-xs text-slate-400">Solo los administradores pueden modificar la configuración.</p>
          )}

          {isAdmin && (
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-md bg-[#002B49] px-4 py-2 text-sm font-medium text-white hover:bg-[#003a63] disabled:opacity-60 transition-colors"
              >
                {isPending ? 'Guardando...' : 'Guardar'}
              </button>

              {isSuccess && (
                <span className="text-sm text-green-600 font-medium">
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
