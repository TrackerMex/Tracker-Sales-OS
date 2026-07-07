import * as React from "react"

import { cn } from "@/lib/utils"

type Picker = "hours" | "hours12" | "minutes"

interface TimePickerInputProps
  extends Omit<React.ComponentProps<"input">, "value" | "onChange"> {
  picker: Picker
  value: number
  displayValue?: string
  onChange: (value: number) => void
  onRightFocus?: () => void
  onLeftFocus?: () => void
}

const TimePickerInput = React.forwardRef<HTMLInputElement, TimePickerInputProps>(
  (
    {
      picker,
      value,
      displayValue,
      onChange,
      onRightFocus,
      onLeftFocus,
      className,
      ...props
    },
    ref,
  ) => {
    const [flag, setFlag] = React.useState(false)
    const isHours12 = picker === "hours12"
    const max = picker === "minutes" ? 59 : 23
    const shown = displayValue ?? String(value).padStart(2, "0")

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
      if (e.key === "Tab") return
      e.preventDefault()

      if (e.key === "ArrowRight") return onRightFocus?.()
      if (e.key === "ArrowLeft") return onLeftFocus?.()
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        const step = e.key === "ArrowUp" ? 1 : -1
        if (isHours12) {
          onChange(((value - 1 + step + 12) % 12) + 1)
        } else {
          onChange((value + step + (max + 1)) % (max + 1))
        }
        return
      }
      if (e.key === "Backspace") {
        setFlag(false)
        if (!shown) onLeftFocus?.()
        return
      }
      if (e.key >= "0" && e.key <= "9") {
        const base = String(value).padStart(2, "0")
        const next = flag ? base.slice(1) + e.key : "0" + e.key
        onChange(
          isHours12
            ? Math.max(1, Math.min(Number(next), 12))
            : Math.min(Number(next), max),
        )
        if (flag) onRightFocus?.()
        setFlag((prev) => !prev)
      }
    }

    return (
      <input
        {...props}
        ref={ref}
        type="text"
        inputMode="numeric"
        maxLength={2}
        value={shown}
        onChange={() => undefined}
        onKeyDown={handleKeyDown}
        onFocus={(e) => {
          setFlag(false)
          e.target.select()
        }}
        className={cn(
          "w-7 border-0 bg-transparent p-0 text-center tabular-nums text-slate-900 outline-none focus:bg-transparent disabled:cursor-not-allowed",
          className,
        )}
      />
    )
  },
)
TimePickerInput.displayName = "TimePickerInput"

interface TimePeriodToggleProps
  extends Omit<React.ComponentProps<"button">, "value" | "onChange"> {
  value: "AM" | "PM"
  onChange: (value: "AM" | "PM") => void
}

const TimePeriodToggle = React.forwardRef<
  HTMLButtonElement,
  TimePeriodToggleProps
>(({ value, onChange, className, ...props }, ref) => {
  function toggle() {
    onChange(value === "AM" ? "PM" : "AM")
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault()
      toggle()
    }
  }

  return (
    <button
      {...props}
      ref={ref}
      type="button"
      onClick={toggle}
      onKeyDown={handleKeyDown}
      className={cn(
        "border-0 bg-transparent p-0 text-center tabular-nums text-slate-900 outline-none focus:bg-transparent disabled:cursor-not-allowed",
        className,
      )}
    >
      {value}
    </button>
  )
})
TimePeriodToggle.displayName = "TimePeriodToggle"

export { TimePickerInput, TimePeriodToggle }
