import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const surfaceVariants = cva(
  "relative overflow-hidden transition-all duration-300",
  {
    variants: {
      variant: {
        glass: "bg-neutral-900/40 backdrop-blur-2xl border border-white/5 shadow-2xl",
        gold: "bg-neutral-900/60 backdrop-blur-2xl border border-arena-gold/30 shadow-[0_0_20px_-10px_hsl(var(--arena-gold)/0.3)]",
        blood: "bg-neutral-900/60 backdrop-blur-2xl border border-arena-blood/30 shadow-[0_0_20px_-10px_hsl(var(--arena-blood)/0.3)]",
        paper: "bg-[#faf9f6] dark:bg-[#1a1918] border-2 border-double border-foreground/10 shadow-xl",
        neon: "bg-neutral-900/80 border border-primary/20 shadow-[0_0_15px_-5px_hsl(var(--primary)/0.4)]",
        ghost: "bg-transparent border-transparent shadow-none",
      },
      padding: {
        none: "p-0",
        sm: "p-3",
        md: "p-6",
        lg: "p-10",
      },
      rounded: {
        none: "rounded-none",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
        "2xl": "rounded-2xl",
        "3xl": "rounded-3xl",
      },
    },
    defaultVariants: {
      variant: "glass",
      padding: "md",
      rounded: "xl",
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
          glow && variant === "gold" && "glow-gold",
          glow && variant === "blood" && "glow-blood",
          className
        )}
        {...props}
      />
    );
  }
);

Surface.displayName = "Surface";

export { Surface, surfaceVariants };
