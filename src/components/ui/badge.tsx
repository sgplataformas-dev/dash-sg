import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:     "border-transparent bg-brand-blue text-primary-foreground",
        secondary:   "border-transparent bg-card text-muted-foreground",
        destructive: "border-transparent bg-brand-red text-white",
        outline:     "text-foreground border-border",
        success:     "bg-brand-green/15 text-brand-green border border-brand-green/30",
        warning:     "bg-brand-yellow/20 text-brand-yellow border border-brand-yellow/30",
        error:       "bg-brand-red/20 text-brand-red border border-brand-red/30",
        info:        "bg-brand-blue/15 text-brand-blue border border-brand-blue/30",
        gray:        "bg-border/60 text-muted-foreground border border-border",
        active:      "bg-brand-green/15 text-brand-green border border-brand-green/30",
        paused:      "bg-brand-yellow/20 text-brand-yellow border border-brand-yellow/30",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
