import { NavLink } from "react-router-dom"
import {
  LayoutDashboard,
  UserCircle,
  Users,
  Server,
  BarChart3,
  ClipboardList,
  Bug,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react"
import { cn } from "../lib/utils"
import { getVisibleNavItems, type Permission } from "../lib/permissions"
import type { UserRole } from "../context/AuthContext"

interface NavItemDef {
  to: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  color: string
}

const ALL_NAV_ITEMS: NavItemDef[] = [
  { to: "/", icon: LayoutDashboard, label: "工作台", color: "text-indigo-500" },
  { to: "/profile", icon: UserCircle, label: "个人信息", color: "text-emerald-500" },
  { to: "/management", icon: Users, label: "账号管理", color: "text-blue-500" },
  { to: "/resources", icon: Server, label: "BOSS资源", color: "text-amber-500" },
  { to: "/statistics", icon: BarChart3, label: "数据统计", color: "text-violet-500" },
  { to: "/logs", icon: ClipboardList, label: "操作日志", color: "text-rose-500" },
  { to: "/bugs", icon: Bug, label: "Bug记录", color: "text-orange-500" },
]

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onMobileClose: () => void
  userRole?: UserRole
}

export function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onMobileClose, userRole }: SidebarProps) {
  // Filter nav items based on user role
  const visiblePermissions = getVisibleNavItems(userRole || "boss")
  const visiblePaths = new Set(visiblePermissions.map((p) => p.to))
  const navItems = ALL_NAV_ITEMS.filter((item) => visiblePaths.has(item.to))

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col border-r bg-card transition-all duration-300",
          // Desktop: normal collapse behavior
          "hidden lg:flex",
          collapsed ? "lg:w-16" : "lg:w-60",
          // Mobile: overlay drawer
          mobileOpen
            ? "flex w-60 animate-slide-in-left"
            : "hidden"
        )}
      >
        {/* Logo + Close (mobile) */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/20 overflow-hidden">
              <img src="/logo-yaosiji.png" alt="姚司机" className="h-full w-full object-cover" />
            </div>
            {!collapsed && (
              <div className="animate-fade-in">
                <h1 className="text-sm font-bold">姚司机·BOSS资源管理</h1>
                <p className="text-[10px] text-muted-foreground">资源分配系统</p>
              </div>
            )}
          </div>
          {/* Close button - mobile only */}
          <button
            onClick={onMobileClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={onMobileClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )
              }
            >
              <item.icon className={cn("h-5 w-5 shrink-0", "group-hover:scale-110 transition-transform duration-200")} />
              {!collapsed && <span className="animate-fade-in">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse Button - desktop only */}
        <div className="hidden border-t p-3 lg:block">
          <button
            onClick={onToggleCollapse}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-accent transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed && "收起侧栏"}
          </button>
        </div>
      </aside>
    </>
  )
}
