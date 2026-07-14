import * as React from "react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button-variants"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "relative flex flex-col gap-2 sm:flex-row",
        month: "flex flex-col gap-4",
        month_caption: "relative flex h-7 w-full items-center justify-center",
        caption_label: "text-[13px] font-semibold text-slate-900 capitalize",
        nav: "absolute inset-x-0 top-0 z-10 flex w-full items-center justify-between",
        button_previous: cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "size-7 rounded-lg p-0 opacity-60 hover:opacity-100"
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "size-7 rounded-lg p-0 opacity-60 hover:opacity-100"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "w-8 rounded-md text-[11px] font-medium text-muted-foreground capitalize",
        week: "mt-2 flex w-full",
        day: "relative size-8 p-0 text-center text-[13px] focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 rounded-lg p-0 text-[13px] font-normal aria-selected:opacity-100"
        ),
        selected:
          "[&>button]:bg-[var(--tracker-blue)] [&>button]:text-white [&>button]:hover:bg-[var(--tracker-blue)] [&>button]:hover:text-white",
        today: "[&>button]:font-bold [&>button]:text-[var(--tracker-blue)]",
        outside: "text-muted-foreground opacity-50 aria-selected:opacity-40",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...chevronProps }) => (
          <HugeiconsIcon
            icon={orientation === "left" ? ArrowLeft01Icon : ArrowRight01Icon}
            strokeWidth={2}
            className={cn("size-4", chevronProps.className)}
          />
        ),
      }}
      {...props}
    />
  )
}

export { Calendar }
