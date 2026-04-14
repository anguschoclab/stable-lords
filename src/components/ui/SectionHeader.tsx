import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  align?: "left" | "center" | "right";
  variant?: "default" | "accent" | "subtle";
}

const SectionHeader = React.forwardRef<HTMLDivElement, SectionHeaderProps>(
  ({ className, title, subtitle, icon: Icon, align = "left", variant = "default", ...props }, ref) => {
    const alignClasses = {
      left: "items-start",
      center: "items-center",
      right: "items-end",
    };

    const variantClasses = {
      default: "text-foreground",
      accent: "text-primary",
      subtle: "text-muted-foreground",
    };

    return (
      <div
        ref={ref}
        className={cn("relative space-y-3 pb-4", alignClasses[align], className)}
        {...props}
      >
        <div className={cn("flex items-center gap-3", align === "center" && "justify-center")}>
          {Icon && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="p-1.5 bg-primary/10 border border-primary/20"
            >
              <Icon className="h-4 w-4 text-primary" />
            </motion.div>
          )}
          <motion.h2
            initial={{ opacity: 0, x: align === "right" ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "font-display text-xl md:text-2xl font-black tracking-tight uppercase leading-none text-carved",
              variantClasses[variant]
            )}
          >
            {title}
          </motion.h2>
        </div>

        {subtitle && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className={cn(
              "text-[10px] uppercase tracking-[0.2em] font-black opacity-55",
              align === "center" && "text-center"
            )}
          >
            {subtitle}
          </motion.p>
        )}

        {/* Gradient divider */}
        <div className="relative h-px w-full mt-3">
          <div
            className="absolute inset-0"
            style={{
              background:
                align === "center"
                  ? "linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.3) 50%, transparent 100%)"
                  : "linear-gradient(90deg, hsl(var(--primary) / 0.4) 0%, hsl(var(--accent) / 0.2) 40%, transparent 80%)",
            }}
          />
        </div>
      </div>
    );
  }
);

SectionHeader.displayName = "SectionHeader";

export { SectionHeader };
