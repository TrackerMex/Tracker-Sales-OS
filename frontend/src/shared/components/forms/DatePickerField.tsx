import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar01Icon } from '@hugeicons/core-free-icons'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface DatePickerFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}

function parseDateValue(value: string): Date | undefined {
  if (!value) return undefined
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return undefined
  return new Date(year, month - 1, day)
}

function toDateValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function DatePickerField({
  value,
  onChange,
  placeholder = 'Seleccionar fecha',
  disabled,
  ...ariaProps
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false)
  const selected = parseDateValue(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          {...ariaProps}
          className="flex w-full items-center justify-between gap-1.5 rounded-lg border-[1.5px] border-[var(--tracker-border)] bg-[var(--tracker-surface-alt)] px-3 py-2 text-left text-[13px] font-medium text-slate-900 transition-colors outline-none focus:border-[var(--tracker-green)] focus:bg-white disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-[var(--tracker-danger)]"
        >
          <span className={cn('truncate', !selected && 'text-muted-foreground')}>
            {selected ? format(selected, 'dd/MM/yyyy') : placeholder}
          </span>
          <HugeiconsIcon
            icon={Calendar01Icon}
            strokeWidth={2}
            className="pointer-events-none size-4 shrink-0 text-muted-foreground"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          locale={es}
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            if (date) onChange(toDateValue(date))
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
