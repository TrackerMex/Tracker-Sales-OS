import * as React from "react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button-variants"
import { ChevronLeftIcon, ChevronRightIcon } from "@/shared/components/Icon"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-2", className)}
      classNames={{
        months: "relative flex flex-col gap-2 sm:flex-row",
        month: "flex flex-col gap-4",
        month_caption: "relative flex h-7 w-full items-center justify-center",
        caption_label: "text-xs font-medium capitalize",
        nav: "absolute inset-x-0 top-0 z-10 flex w-full items-center justify-between",
        button_previous: cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "size-7 p-0 opacity-60 hover:opacity-100"
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "size-7 p-0 opacity-60 hover:opacity-100"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "w-8 rounded-none text-xs font-normal text-muted-foreground capitalize",
        week: "mt-2 flex w-full",
        day: "relative size-8 p-0 text-center text-xs focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 p-0 text-xs font-normal aria-selected:opacity-100"
        ),
        selected:
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground",
        today: "rounded-md bg-muted text-foreground",
        outside: "text-muted-foreground opacity-50 aria-selected:opacity-40",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...chevronProps }) => {
          const ChevronIcon =
            orientation === "left" ? ChevronLeftIcon : ChevronRightIcon
          return <ChevronIcon className={cn("size-4", chevronProps.className)} />
        },
      }}
      {...props}
    />
  )
}

export { Calendar }
