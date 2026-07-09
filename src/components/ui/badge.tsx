import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:     "border-transparent bg-[#74B9FF] text-[#0F0F23]",
        secondary:   "border-transparent bg-[#1A1A2E] text-[#8892a4]",
        destructive: "border-transparent bg-[#E94560] text-white",
        outline:     "text-[#E0E0E0] border-[#2d2d4a]",
        success:     "bg-[#00B894]/15 text-[#00B894] border border-[#00B894]/30",
        warning:     "bg-[#FDCB6E]/20 text-[#FDCB6E] border border-[#FDCB6E]/30",
        error:       "bg-[#E94560]/20 text-[#E94560] border border-[#E94560]/30",
        info:        "bg-[#74B9FF]/15 text-[#74B9FF] border border-[#74B9FF]/30",
        gray:        "bg-[#2d2d4a]/60 text-[#8892a4] border border-[#2d2d4a]",
        active:      "bg-[#00B894]/15 text-[#00B894] border border-[#00B894]/30",
        paused:      "bg-[#FDCB6E]/20 text-[#FDCB6E] border border-[#FDCB6E]/30",
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
