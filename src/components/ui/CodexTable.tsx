import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const tableVariants = cva(
  "w-full border-collapse overflow-hidden",
  {
    variants: {
      variant: {
        default: "border border-border/40",
        glass: "border border-[#2A1E13] backdrop-blur-sm",
        minimal: "border-0",
      },
      density: {
        compact: "text-xs",
        default: "text-sm",
        spacious: "text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      density: "default",
    },
  }
);

const headerVariants = cva(
  "font-display font-black uppercase tracking-wider text-left border-b",
  {
    variants: {
      variant: {
        default: "bg-white/[0.03] border-primary/20 text-primary",
        glass: "bg-[#120D09]/80 border-[#2A1E13] text-primary",
        minimal: "bg-transparent border-border/20 text-muted-foreground",
      },
      density: {
        compact: "px-2 py-1.5 text-[10px]",
        default: "px-4 py-2.5 text-[9px]",
        spacious: "px-6 py-3 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      density: "default",
    },
  }
);

const cellVariants = cva(
  "border-b border-border/20",
  {
    variants: {
      density: {
        compact: "px-2 py-1.5",
        default: "px-4 py-2.5",
        spacious: "px-6 py-3",
      },
    },
    defaultVariants: {
      density: "default",
    },
  }
);

// Left border accent variants per design bible
type AccentType = "none" | "crimson" | "gold" | "blood";

interface CodexTableProps
  extends React.TableHTMLAttributes<HTMLTableElement>,
    VariantProps<typeof tableVariants> {
  accentColumn?: number; // Which column gets the left border accent (0-indexed)
  accentType?: AccentType;
}

const CodexTable = React.forwardRef<HTMLTableElement, CodexTableProps>(
  ({ className, variant, density, accentColumn = 0, accentType = "crimson", ...props }, ref) => {
    return (
      <div className="overflow-x-auto">
        <table
          ref={ref}
          className={cn(tableVariants({ variant, density }), className)}
          {...props}
        />
      </div>
    );
  }
);

CodexTable.displayName = "CodexTable";

// Header component with crimson left border accent
interface CodexTableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  variant?: "default" | "glass" | "minimal";
  density?: "compact" | "default" | "spacious";
}

const CodexTableHeader = React.forwardRef<HTMLTableSectionElement, CodexTableHeaderProps>(
  ({ className, variant, density, children, ...props }, ref) => {
    return (
      <thead ref={ref} className={cn("bg-primary/5", className)} {...props}>
        <tr>
          {React.Children.map(children, (child, index) => {
            if (React.isValidElement(child)) {
              return (
                <th
                  className={cn(
                    headerVariants({ variant, density }),
                    index === 0 && "border-l-2 border-l-primary"
                  )}
                >
                  {child.props.children}
                </th>
              );
            }
            return child;
          })}
        </tr>
      </thead>
    );
  }
);

CodexTableHeader.displayName = "CodexTableHeader";

// Body component
interface CodexTableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  density?: "compact" | "default" | "spacious";
}

const CodexTableBody = React.forwardRef<HTMLTableSectionElement, CodexTableBodyProps>(
  ({ className, density, children, ...props }, ref) => {
    return (
      <tbody ref={ref} className={cn("divide-y divide-border/20", className)} {...props}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, { density } as any);
          }
          return child;
        })}
      </tbody>
    );
  }
);

CodexTableBody.displayName = "CodexTableBody";

// Row component with optional accent
interface CodexTableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  accent?: boolean;
  accentType?: AccentType;
  density?: "compact" | "default" | "spacious";
}

const CodexTableRow = React.forwardRef<HTMLTableRowElement, CodexTableRowProps>(
  ({ className, accent = true, accentType = "crimson", density, children, ...props }, ref) => {
    const accentClasses = {
      none: "",
      crimson: "border-l-2 border-l-primary",
      gold: "border-l-2 border-l-[hsl(var(--arena-gold))]",
      blood: "border-l-2 border-l-destructive",
    };

    return (
      <tr
        ref={ref}
        className={cn(
          "transition-colors hover:bg-white/5",
          className
        )}
        {...props}
      >
        {React.Children.map(children, (child, index) => {
          if (React.isValidElement(child)) {
            return (
              <td
                className={cn(
                  cellVariants({ density }),
                  index === 0 && accent && accentClasses[accentType]
                )}
              >
                {child.props.children}
              </td>
            );
          }
          return child;
        })}
      </tr>
    );
  }
);

CodexTableRow.displayName = "CodexTableRow";

// Cell component for direct usage
interface CodexTableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  density?: "compact" | "default" | "spacious";
  accent?: boolean;
}

const CodexTableCell = React.forwardRef<HTMLTableCellElement, CodexTableCellProps>(
  ({ className, density, children, ...props }, ref) => {
    return (
      <td ref={ref} className={cn(cellVariants({ density }), className)} {...props}>
        {children}
      </td>
    );
  }
);

CodexTableCell.displayName = "CodexTableCell";

// Header cell for direct usage
interface CodexTableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  variant?: "default" | "glass" | "minimal";
  density?: "compact" | "default" | "spacious";
  accent?: boolean;
}

const CodexTableHead = React.forwardRef<HTMLTableCellElement, CodexTableHeadProps>(
  ({ className, variant, density, children, ...props }, ref) => {
    return (
      <th ref={ref} className={cn(headerVariants({ variant, density }), className)} {...props}>
        {children}
      </th>
    );
  }
);

CodexTableHead.displayName = "CodexTableHead";

export {
  CodexTable,
  CodexTableHeader,
  CodexTableBody,
  CodexTableRow,
  CodexTableCell,
  CodexTableHead,
  tableVariants,
  headerVariants,
  cellVariants,
};
