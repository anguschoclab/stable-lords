import * as React from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
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
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
              )}
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="font-display text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter uppercase text-foreground leading-none"
              >
                {title}
              </motion.h1>
            </div>
            {subtitle && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-xs md:text-sm text-muted-foreground font-mono font-black uppercase tracking-[0.2em] opacity-70"
              >
                {subtitle}
              </motion.div>
            )}
          </div>

          {actions && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3"
            >
              {actions}
            </motion.div>
          )}
        </div>
        <Separator className="bg-gradient-to-r from-primary/40 via-border to-transparent h-[1px]" />
      </div>
    );
  }
);

PageHeader.displayName = "PageHeader";

export { PageHeader };
