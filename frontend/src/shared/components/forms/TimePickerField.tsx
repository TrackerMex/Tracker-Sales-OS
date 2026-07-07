import { useRef } from "react"
import { TimePickerInput, TimePeriodToggle } from "@/components/ui/time-picker"
import { cn } from "@/lib/utils"

interface TimePickerFieldProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  "aria-invalid"?: boolean
  "aria-describedby"?: string
  className?: string
}

function pad(n: number): string {
  return String(n).padStart(2, "0")
}

export function TimePickerField({
  value,
  onChange,
  disabled,
  className,
  ...ariaProps
}: TimePickerFieldProps) {
  const hourRef = useRef<HTMLInputElement>(null)
  const minuteRef = useRef<HTMLInputElement>(null)
  const periodRef = useRef<HTMLButtonElement>(null)

  const [h, m] = value ? value.split(":") : ["", ""]
  const hours = h === "" ? undefined : Number(h)
  const minutes = m === "" ? undefined : Number(m)

  // 24h stored, 12h shown: 00->12AM, 12->12PM, 13->1PM, 23->11PM
  const period: "AM" | "PM" = (hours ?? 0) < 12 ? "AM" : "PM"
  const hour12 =
    hours === undefined ? undefined : hours % 12 === 0 ? 12 : hours % 12

  function emit(
    nextHour12: number,
    nextMinutes: number,
    nextPeriod: "AM" | "PM",
  ) {
    const to24 = (nextHour12 % 12) + (nextPeriod === "PM" ? 12 : 0)
    onChange(`${pad(to24)}:${pad(nextMinutes)}`)
  }

  return (
    <div
      {...ariaProps}
      className={cn(
        "flex w-full min-w-0 items-center gap-0.5 rounded-lg border-[1.5px] border-[var(--tracker-border)] bg-[var(--tracker-surface-alt)] px-3 py-2 text-[13px] font-medium text-slate-900 transition-colors outline-none focus-within:border-[var(--tracker-green)] focus-within:bg-white aria-invalid:border-[var(--tracker-danger)]",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <TimePickerInput
        ref={hourRef}
        picker="hours12"
        value={hour12 ?? 12}
        displayValue={hour12 === undefined ? "" : pad(hour12)}
        disabled={disabled}
        onChange={(v) => emit(v, minutes ?? 0, period)}
        onRightFocus={() => minuteRef.current?.focus()}
      />
      <span className="text-muted-foreground">:</span>
      <TimePickerInput
        ref={minuteRef}
        picker="minutes"
        value={minutes ?? 0}
        displayValue={minutes === undefined ? "" : pad(minutes)}
        disabled={disabled}
        onChange={(v) => emit(hour12 ?? 12, v, period)}
        onLeftFocus={() => hourRef.current?.focus()}
        onRightFocus={() => periodRef.current?.focus()}
      />
      <TimePeriodToggle
        ref={periodRef}
        value={period}
        disabled={disabled}
        onChange={(p) => emit(hour12 ?? 12, minutes ?? 0, p)}
        className="ml-1"
      />
    </div>
  )
}
