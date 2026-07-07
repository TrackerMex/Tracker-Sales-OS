import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "w-full min-w-0 rounded-lg border-[1.5px] border-[var(--tracker-border)] bg-[var(--tracker-surface-alt)] px-3 py-2 text-[13px] font-medium text-slate-900 transition-colors outline-none placeholder:text-muted-foreground focus:border-[var(--tracker-green)] focus:bg-white disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-[var(--tracker-danger)] file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className
      )}
      {...props}
    />
  )
}

export { Input }
