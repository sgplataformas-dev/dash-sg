import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:     "border-transparent bg-[#4FA3FF] text-[#0A0A0F]",
        secondary:   "border-transparent bg-[#15151B] text-[#909099]",
        destructive: "border-transparent bg-[#FF3B5C] text-white",
        outline:     "text-[#F2F2F0] border-[#27272F]",
        success:     "bg-[#12E28A]/15 text-[#12E28A] border border-[#12E28A]/30",
        warning:     "bg-[#FFC24B]/20 text-[#FFC24B] border border-[#FFC24B]/30",
        error:       "bg-[#FF3B5C]/20 text-[#FF3B5C] border border-[#FF3B5C]/30",
        info:        "bg-[#4FA3FF]/15 text-[#4FA3FF] border border-[#4FA3FF]/30",
        gray:        "bg-[#27272F]/60 text-[#909099] border border-[#27272F]",
        active:      "bg-[#12E28A]/15 text-[#12E28A] border border-[#12E28A]/30",
        paused:      "bg-[#FFC24B]/20 text-[#FFC24B] border border-[#FFC24B]/30",
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
