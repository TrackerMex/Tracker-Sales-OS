import { cva, type VariantProps } from "class-variance-authority"

export const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-[5px] border border-transparent px-[7px] py-[2px] text-[10px] font-semibold uppercase leading-none tracking-[0.03em] whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary: "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive: "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline: "border-border bg-input/30 text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost: "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
        navy: "bg-[#e8f2f9] text-[#002B49]",
        green: "bg-[#eefad4] text-[#4a7c00]",
        amber: "bg-[#fef3c7] text-[#b45309]",
        red: "bg-[#fee2e2] text-[#b91c1c]",
        gray: "bg-[#f1f5f9] text-[#475569]",
        purple: "bg-[#ede9fe] text-[#6d28d9]",
        blue: "bg-[#dbeafe] text-[#1d4ed8]",
        yellow: "bg-[#fef3c7] text-[#b45309]",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>
