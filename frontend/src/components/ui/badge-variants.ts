import { cva, type VariantProps } from "class-variance-authority"

export const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md border border-transparent px-2 py-0.5 text-xs font-normal whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary: "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive: "bg-destructive/10 text-status-danger focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline: "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost: "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
        // Legacy tracker names mapped to the DESIGN.md state tokens (kept so modules don't break).
        navy: "bg-primary/10 text-primary",
        green: "bg-chart-2/10 text-status-success",
        amber: "bg-chart-4/15 text-foreground",
        red: "bg-destructive/10 text-status-danger",
        gray: "bg-muted text-foreground",
        purple: "bg-chart-1/10 text-status-progress",
        blue: "bg-chart-1/10 text-status-progress",
        yellow: "bg-chart-4/15 text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>
