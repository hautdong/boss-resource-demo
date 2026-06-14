import { cn } from "../lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"

interface StatCardProps {
  title: string | React.ReactNode
  value: string | React.ReactNode
  change?: string | React.ReactNode
  trend?: "up" | "down"
  icon: React.ReactNode
  className?: string
}

export function StatCard({ title, value, change, trend, icon, className }: StatCardProps) {
  return (
    <div className={cn("rounded-xl border bg-card p-5 shadow-sm premium-card animate-fade-in", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {change && (
          <div className="mt-1 flex items-center gap-1">
            {trend === "up" ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            ) : trend === "down" ? (
              <TrendingDown className="h-3.5 w-3.5 text-destructive" />
            ) : null}
            <span
              className={cn(
                "text-xs font-medium",
                trend === "up" && "text-emerald-500",
                trend === "down" && "text-destructive",
                !trend && "text-muted-foreground"
              )}
            >
              {change}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
