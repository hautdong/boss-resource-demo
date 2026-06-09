import { cn } from "../../lib/utils"

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "primary" | "secondary" | "destructive" | "success" | "warning" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        {
          "bg-primary/10 text-primary": variant === "primary",
          "bg-secondary text-secondary-foreground": variant === "secondary",
          "bg-destructive/10 text-destructive": variant === "destructive",
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400": variant === "success",
          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400": variant === "warning",
          "border border-border bg-transparent text-muted-foreground": variant === "outline",
          "bg-primary/5 text-muted-foreground": variant === "default",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
