import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { cn } from "../lib/utils"

type Theme = "light" | "dark"

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<Theme>(() => {
    const stored = localStorage.getItem("boss-resource-theme")
    if (stored === "dark" || stored === "light") return stored
    return "light"
  })

  React.useEffect(() => {
    const root = document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    localStorage.setItem("boss-resource-theme", theme)
  }, [theme])

  const themes: { value: Theme; icon: React.ReactNode; label: string }[] = [
    { value: "light", icon: <Sun className="h-4 w-4" />, label: "浅色" },
    { value: "dark", icon: <Moon className="h-4 w-4" />, label: "深色" },
  ]

  return (
    <div className="flex items-center gap-1 rounded-lg border p-1 bg-background/50">
      {themes.map((t) => (
        <button
          key={t.value}
          onClick={() => setTheme(t.value)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all duration-200",
            theme === t.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          title={t.label}
        >
          {t.icon}
          <span className="hidden sm:inline">{t.label}</span>
        </button>
      ))}
    </div>
  )
}
