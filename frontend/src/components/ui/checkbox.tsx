import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { CheckIcon } from "@/shared/components/Icon"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-4 shrink-0 rounded-[4px] border-[1.5px] border-[var(--tracker-border)] bg-[var(--tracker-surface-alt)] transition-colors outline-none focus-visible:border-[var(--tracker-green)] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-[var(--tracker-danger)] data-[state=checked]:border-[var(--tracker-green)] data-[state=checked]:bg-[var(--tracker-green)] data-[state=checked]:text-[var(--tracker-dark)]",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current"
      >
        <CheckIcon className="size-3" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
