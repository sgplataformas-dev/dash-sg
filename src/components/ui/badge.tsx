import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:     "border-transparent bg-[#3B82F6] text-white",
        secondary:   "border-transparent bg-[#111827] text-[#64748B]",
        destructive: "border-transparent bg-red-600 text-white",
        outline:     "text-[#E2E8F0] border-[#1E2D4A]",
        success:     "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
        warning:     "bg-amber-500/20 text-amber-400 border border-amber-500/30",
        error:       "bg-red-500/20 text-red-400 border border-red-500/30",
        info:        "bg-[#3B82F6]/15 text-[#93C5FD] border border-[#3B82F6]/30",
        gray:        "bg-[#1E2D4A]/60 text-[#64748B] border border-[#1E2D4A]",
        active:      "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
        paused:      "bg-amber-500/20 text-amber-400 border border-amber-500/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
