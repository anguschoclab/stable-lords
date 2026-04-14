import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const surfaceVariants = cva(
  "relative overflow-hidden transition-all duration-300",
  {
    variants: {
      variant: {
        // Primary working surface — warm dark leather/timber
        glass: [
          "backdrop-blur-xl shadow-2xl border",
          "bg-[#120D09]/75",
          "border-[#2A1E13]",
          "[border-top-color:rgba(80,55,30,0.45)]",
          "[border-left-color:rgba(70,48,26,0.4)]",
          "[background-image:linear-gradient(135deg,rgba(255,245,220,0.018)_0%,transparent_60%,rgba(200,120,20,0.02)_100%)]",
        ],

        // Trophy/achievement surface — bronze-gold accented
        gold: [
          "backdrop-blur-xl shadow-2xl border",
          "bg-[#120D09]/70",
          "border-[hsl(var(--arena-gold)/0.25)]",
          "shadow-[0_0_30px_-12px_hsl(var(--arena-gold)/0.25)]",
          "[background-image:linear-gradient(135deg,hsl(var(--arena-gold)/0.04)_0%,transparent_100%)]",
        ],

        // Danger/kill surface — blood crimson accented
        blood: [
          "backdrop-blur-xl shadow-2xl border",
          "bg-[#120D09]/70",
          "border-[hsl(var(--arena-blood)/0.25)]",
          "shadow-[0_0_30px_-12px_hsl(var(--arena-blood)/0.3)]",
          "[background-image:linear-gradient(135deg,hsl(var(--arena-blood)/0.05)_0%,transparent_100%)]",
        ],

        // Aged parchment — historical, chronicle, gazette content
        paper: [
          "shadow-xl border-2 border-double",
          "bg-[#0F0A06]",
          "border-[rgba(60,42,22,0.7)]",
          "[border-top-color:rgba(100,70,36,0.5)]",
          "[background-image:linear-gradient(145deg,rgba(24,16,9,0.9)_0%,rgba(18,12,7,0.95)_50%,rgba(22,15,8,0.9)_100%)]",
        ],

        // Active/highlighted — crimson glow
        neon: [
          "backdrop-blur-md shadow-2xl border",
          "bg-[#120D09]/80",
          "border-[hsl(var(--primary)/0.2)]",
          "shadow-[0_0_20px_-8px_hsl(var(--primary)/0.35)]",
        ],

        // Transparent — no visual treatment
        ghost: "bg-transparent border-transparent shadow-none",
      },

      padding: {
        none: "p-0",
        sm:   "p-3",
        md:   "p-6",
        lg:   "p-10",
      },

      rounded: {
        none:  "rounded-none",
        sm:    "rounded-sm",
        md:    "rounded-md",
        lg:    "rounded-lg",
        xl:    "rounded-xl",
        "2xl": "rounded-2xl",
        "3xl": "rounded-3xl",
      },
    },
    defaultVariants: {
      variant: "glass",
      padding: "md",
      rounded: "none",   // Stone-cut default — hard edges throughout
    },
  }
);

export interface SurfaceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof surfaceVariants> {
  asChild?: boolean;
  glow?: boolean;
}

const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(
  ({ className, variant, padding, rounded, glow, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          surfaceVariants({ variant, padding, rounded }),
          glow && variant === "gold"  && "glow-gold",
          glow && variant === "blood" && "glow-blood",
          glow && variant === "glass" && "glow-torch",
          className
        )}
        {...props}
      />
    );
  }
);

Surface.displayName = "Surface";

export { Surface, surfaceVariants };
