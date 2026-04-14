import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ElementType;
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, title, subtitle, actions, icon: Icon, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("relative space-y-6 pb-6", className)}
        {...props}
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-4">
              {Icon && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="imperial-ring shrink-0"
                >
                  <Icon className="h-5 w-5 text-accent" />
                </motion.div>
              )}
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="font-display text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter uppercase text-foreground leading-none text-carved"
              >
                {title}
              </motion.h1>
            </div>
            {subtitle && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="text-[10px] md:text-xs text-muted-foreground font-black uppercase tracking-[0.25em] opacity-55 pl-0.5"
              >
                {subtitle}
              </motion.div>
            )}
          </div>

          {actions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="flex items-center gap-3"
            >
              {actions}
            </motion.div>
          )}
        </div>

        {/* Ornamental separator — gradient from accent gold to transparent */}
        <div className="relative h-px">
          {/* Primary line */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, hsl(var(--primary) / 0.5) 0%, hsl(var(--accent) / 0.3) 30%, hsl(var(--border)) 70%, transparent 100%)",
            }}
          />
          {/* Secondary inset line for depth */}
          <div
            className="absolute top-[2px] left-4 right-0"
            style={{
              height: "1px",
              background:
                "linear-gradient(90deg, hsl(var(--accent) / 0.12) 0%, transparent 60%)",
            }}
          />
        </div>
      </div>
    );
  }
);

PageHeader.displayName = "PageHeader";

export { PageHeader };
