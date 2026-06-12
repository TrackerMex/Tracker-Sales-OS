import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isAxiosError } from 'axios'

export type ApiErrorKind = 'validation' | 'auth' | 'forbidden' | 'network' | 'server' | 'unknown'

export interface ParsedApiError {
  kind: ApiErrorKind
  message: string
  fieldErrors: Record<string, string>
  details: string[]
}

const NETWORK_MESSAGE = 'No se pudo conectar. Tus datos siguen aquí, reintenta.'

const FIELD_LABELS: Record<string, string> = {
  name: 'Nombre',
  domain: 'Dominio',
  type: 'Tipo',
  person: 'Tipo de persona',
  sellerId: 'Vendedor',
  source: 'Fuente',
  stage: 'Etapa',
  expectedAmount: 'Monto esperado',
  units: 'Unidades',
  pain: 'Pain / necesidad',
  provider: 'Proveedor',
  contacts: 'Contactos',
  clientId: 'Cliente',
  contactId: 'Contacto',
  result: 'Resultado',
  summary: 'Resumen',
  discovery: 'Descubrimiento',
  agreement: 'Acuerdo',
  executedAt: 'Fecha de ejecución',
  nextStep: 'Siguiente paso',
  nextObjective: 'Objetivo del siguiente paso',
  nextDate: 'Fecha próxima',
  nextTime: 'Hora próxima',
  title: 'Objetivo',
  scheduledAt: 'Fecha y hora',
  clientName: 'Nombre del cliente',
  clientType: 'Tipo de cliente',
  product: 'Producto',
  amount: 'Monto',
  pay: 'Forma de pago',
  date: 'Fecha',
  notes: 'Notas',
  email: 'Correo',
  phone: 'Teléfono',
  role: 'Rol',
  isDecisionMaker: 'Decisor',
  username: 'Usuario',
  password: 'Contraseña',
  dailyMinPoints: 'Puntos mínimos diarios',
  monthlyAmountGoal: 'Meta mensual de monto',
  monthlyUnitGoal: 'Meta mensual de unidades',
  sellerMonthlyAmountGoal: 'Meta mensual por vendedor',
}

const CONSTRAINT_PATTERNS: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
  [/^must be one of the following values: (.+)$/, (m) => `Debe ser uno de: ${m[1]}`],
  [/^must be a UUID$/, () => 'Debe ser un identificador válido'],
  [/^should not be empty$/, () => 'Este campo es obligatorio'],
  [/^must be an email$/, () => 'Debe ser un correo válido'],
  [/^must be a valid ISO 8601 date string$/, () => 'Debe ser una fecha válida'],
  [/^must be a Date instance$/, () => 'Debe ser una fecha válida'],
  [/^must be a string$/, () => 'Debe ser texto'],
  [/^must be a number conforming to the specified constraints$/, () => 'Debe ser un número'],
  [/^must be a number$/, () => 'Debe ser un número'],
  [/^must be an integer number$/, () => 'Debe ser un número entero'],
  [/^must be a positive number$/, () => 'Debe ser un número positivo'],
  [/^must be a boolean value$/, () => 'Debe ser verdadero o falso'],
  [/^must not be less than (\S+)$/, (m) => `Debe ser al menos ${m[1]}`],
  [/^must not be greater than (\S+)$/, (m) => `No debe ser mayor a ${m[1]}`],
  [/^must be shorter than or equal to (\d+) characters$/, (m) => `Máximo ${m[1]} caracteres`],
  [/^must be longer than or equal to (\d+) characters$/, (m) => `Mínimo ${m[1]} caracteres`],
  [/^must be an array$/, () => 'Formato inválido'],
  [/^must match (.+) regular expression$/, () => 'Formato inválido'],
]

function labelFor(field: string): string {
  const parts = field.split('.')
  if (parts.length === 3 && parts[0] === 'contacts') {
    const idx = Number(parts[1])
    const sub = FIELD_LABELS[parts[2]] ?? parts[2]
    return `Contacto ${Number.isNaN(idx) ? parts[1] : idx + 1} — ${sub}`
  }
  return FIELD_LABELS[field] ?? field
}

function parseValidationMessage(raw: string): { field?: string; message: string; translated: boolean } {
  const propertyMatch = raw.match(/^property ([\w.]+) should not exist$/)
  if (propertyMatch) {
    return { field: propertyMatch[1], message: 'No es un campo permitido', translated: true }
  }
  const match = raw.match(/^([\w.]+) (.+)$/)
  if (!match) return { message: raw, translated: false }
  const [, field, rest] = match
  for (const [pattern, format] of CONSTRAINT_PATTERNS) {
    const m = rest.match(pattern)
    if (m) return { field, message: format(m), translated: true }
  }
  return { field, message: raw, translated: false }
}

export function parseApiError(error: unknown): ParsedApiError {
  if (isAxiosError(error)) {
    if (!error.response) {
      return { kind: 'network', message: NETWORK_MESSAGE, fieldErrors: {}, details: [] }
    }
    const { status, data } = error.response
    if (status === 401) {
      return { kind: 'auth', message: 'Credenciales incorrectas.', fieldErrors: {}, details: [] }
    }
    if (status === 403) {
      return { kind: 'forbidden', message: 'No tienes permisos para esta acción.', fieldErrors: {}, details: [] }
    }
    if (status >= 500) {
      return { kind: 'server', message: NETWORK_MESSAGE, fieldErrors: {}, details: [] }
    }
    if (status === 400) {
      const rawMessages: string[] = Array.isArray(data?.message)
        ? data.message
        : typeof data?.message === 'string'
          ? [data.message]
          : []
      const fieldErrors: Record<string, string> = {}
      const details: string[] = []
      for (const raw of rawMessages) {
        const { field, message, translated } = parseValidationMessage(raw)
        if (field && translated) {
          if (!fieldErrors[field]) fieldErrors[field] = message
          details.push(`${labelFor(field)}: ${message}`)
        } else {
          if (field && !fieldErrors[field]) fieldErrors[field] = message
          details.push(raw)
        }
      }
      return {
        kind: 'validation',
        message: 'No se pudo guardar. Revisa los campos marcados.',
        fieldErrors,
        details,
      }
    }
    const serverMessage = typeof data?.message === 'string' ? data.message : null
    return {
      kind: 'unknown',
      message: serverMessage ?? 'No se pudo completar la operación. Reintenta.',
      fieldErrors: {},
      details: [],
    }
  }
  if (error instanceof Error && error.message) {
    return { kind: 'unknown', message: error.message, fieldErrors: {}, details: [] }
  }
  return { kind: 'unknown', message: 'Ocurrió un error inesperado. Reintenta.', fieldErrors: {}, details: [] }
}

export function useApiFormErrors(error: unknown) {
  const summary = useMemo(() => (error ? parseApiError(error) : null), [error])
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    setFieldErrors(summary?.fieldErrors ?? {})
    if (summary) {
      requestAnimationFrame(() => {
        const form = formRef.current
        if (!form) return
        const invalid = form.querySelector<HTMLElement>('[aria-invalid="true"]')
        if (invalid) {
          invalid.focus()
        } else {
          form.querySelector<HTMLElement>('[role="alert"]')?.scrollIntoView({ block: 'nearest' })
        }
      })
    }
  }, [summary])

  const clearField = useCallback((name: string) => {
    setFieldErrors((current) => {
      if (!(name in current)) return current
      const next = { ...current }
      delete next[name]
      return next
    })
  }, [])

  return { summary, fieldErrors, clearField, formRef }
}
