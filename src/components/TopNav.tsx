import { Bell, Search, LogOut, User, Menu } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { ThemeToggle } from "./ThemeToggle"
import { useAuth } from "../context/AuthContext"

const roleBadgeColor: Record<string, string> = {
  super_admin: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  boss: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
}

interface TopNavProps {
  onMobileMenuToggle: () => void
}

export function TopNav({ onMobileMenuToggle }: TopNavProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center gap-2 sm:gap-4 border-b bg-background/80 backdrop-blur-xl px-3 sm:px-6">
      {/* Mobile hamburger */}
      <button
        onClick={onMobileMenuToggle}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent transition-colors lg:hidden"
        title="菜单"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search - hidden on mobile */}
      <div className="relative flex-1 max-w-md hidden sm:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="搜索功能、菜单..."
          className="w-full rounded-lg border bg-muted/50 pl-9 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
        />
      </div>

      <div className="flex items-center gap-2 sm:gap-3 ml-auto">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <button className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border hover:bg-accent transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-destructive text-[8px] sm:text-[9px] font-bold text-destructive-foreground">
            3
          </span>
        </button>

        {/* User Info - compact on mobile */}
        {user && (
          <div className="flex items-center gap-1 sm:gap-2 rounded-lg border px-1.5 sm:px-3 py-1 sm:py-1.5">
            <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-primary/10">
              <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
            </div>
            <div className="text-left text-xs leading-tight hidden md:block">
              <p className="font-medium text-foreground">{user.name}</p>
              <p className="text-muted-foreground">{user.roleLabel}</p>
            </div>
            <div className="hidden sm:block rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
              {user.role === "super_admin" ? "超管" : user.role === "admin" ? "管理" : "成员"}
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-destructive transition-colors"
          title="退出登录"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
