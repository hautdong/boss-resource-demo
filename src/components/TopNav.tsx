import { Bell, Search, LogOut, User, Menu, Code, X, FileText, CheckCircle2, Package } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { ThemeToggle } from "./ThemeToggle"
import { useAuth } from "../context/AuthContext"
import { useEditMode } from "../context/EditModeContext"
import { getRoleShortLabel } from "../lib/roleConfig"
import { useState, useRef, useEffect } from "react"
import { loadNotifications, markAllRead } from "../lib/notifications"
import type { Notification } from "../lib/notifications"
import { api } from "../lib/api"

interface TopNavProps {
  onMobileMenuToggle: () => void
}

export function TopNav({ onMobileMenuToggle }: TopNavProps) {
  const { user, logout } = useAuth()
  const { editing, toggleEditing } = useEditMode()
  const navigate = useNavigate()
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifCount, setNotifCount] = useState(0)
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [pendingResources, setPendingResources] = useState(0)
  const notifRef = useRef<HTMLDivElement>(null)
  const isAdmin = user?.role === "super_admin" || user?.role === "admin"

  // Refresh notifications every 3 seconds, filtered by current user
  useEffect(() => {
    const refresh = async () => {
      const all = loadNotifications()
      
      // Also fetch from backend API
      let backendNotifs: Notification[] = []
      try {
        const data = await api.notifications.list()
        if (Array.isArray(data)) {
          backendNotifs = data.map((n: any) => ({
            id: n.id,
            type: "points" as const,
            title: n.title,
            message: n.message,
            date: n.createdAt ? new Date(n.createdAt+"Z").toLocaleDateString("zh-CN") : "-",
            read: n.read,
            targetUser: user?.username || "",
            targetUserName: user?.name,
          }))
        }
      } catch {}
      
      // Merge: backend takes priority, then localStorage
      const merged = [...backendNotifs, ...all.filter(a => !backendNotifs.find(b => b.id === a.id))]
      const filtered = merged.filter(
        (n) => isAdmin || n.targetUser === user?.username || n.targetUser === user?.name
      )
      setNotifs(filtered)
      setNotifCount(filtered.filter((n) => !n.read).length)
    }
    refresh()
    const interval = setInterval(refresh, 3000)
    return () => clearInterval(interval)
  }, [isAdmin, user?.username, user?.name])

  // Fetch pending resource count for admin
  useEffect(() => {
    if (!isAdmin) return
    const fetchPending = async () => {
      try {
        const apps = await api.bossResources.applications()
        setPendingResources((apps || []).filter((a: any) => a.status === "pending").length)
      } catch {}
    }
    fetchPending()
    const interval = setInterval(fetchPending, 10000)
    return () => clearInterval(interval)
  }, [isAdmin])

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleMarkAllRead = () => {
    markAllRead()
    api.notifications.readAll().catch(() => {})
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })))
    setNotifCount(0)
  }

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

        {/* Developer Edit Mode Toggle */}
        {user?.role === "developer" && (
          <button
            onClick={toggleEditing}
            className={`relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border transition-colors ${
              editing
                ? "bg-rose-100 border-rose-300 text-rose-600 dark:bg-rose-900/30 dark:border-rose-700 dark:text-rose-400 shadow-sm"
                : "hover:bg-accent"
            }`}
            title={editing ? "退出编辑模式" : "进入编辑模式"}
          >
            <Code className="h-4 w-4" />
            {editing && (
              <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              </span>
            )}
          </button>
        )}

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border hover:bg-accent transition-colors" onClick={() => setNotifOpen(!notifOpen)}>
            <Bell className="h-4 w-4" />
            {(notifCount + pendingResources) > 0 && (
              <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-destructive text-[8px] sm:text-[9px] font-bold text-destructive-foreground">
                {notifCount + pendingResources > 9 ? "9+" : notifCount + pendingResources}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 rounded-xl border bg-card shadow-2xl animate-scale-in overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <span className="text-sm font-semibold">通知</span>
                {notifCount > 0 && (
                  <button className="text-xs text-primary hover:text-primary/80" onClick={handleMarkAllRead}>全部标为已读</button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {isAdmin && pendingResources > 0 && (
                  <div
                    className="px-4 py-3 border-b bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-100/50 dark:hover:bg-blue-900/30 cursor-pointer transition-colors"
                    onClick={() => { navigate("/resources"); setNotifOpen(false) }}
                  >
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-400">待审批资质申请</span>
                        <p className="text-xs text-muted-foreground mt-0.5">有 {pendingResources} 条资质申请等待审批</p>
                      </div>
                    </div>
                  </div>
                )}
                {notifs.length === 0 && pendingResources === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    <Bell className="h-6 w-6 mx-auto mb-2 opacity-40" />
                    暂无通知
                  </div>
                ) : (
                  notifs.slice(0, 20).map((n) => (
                    <div key={n.id} className={`px-4 py-3 border-b last:border-0 hover:bg-accent/50 transition-colors ${!n.read ? "bg-primary/5" : ""}`}>
                      <div className="flex items-start gap-2">
                        {n.type === "resource" ? (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 shrink-0 mt-0.5">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          </div>
                        ) : n.type === "ban" ? (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 shrink-0 mt-0.5">
                            <X className="h-3 w-3 text-red-600 dark:text-red-400" />
                          </div>
                        ) : n.type === "points" ? (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 shrink-0 mt-0.5">
                            <Package className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                          </div>
                        ) : null}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{n.title}</span>
                            {!n.read && <span className="h-2 w-2 rounded-full bg-destructive shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{n.date}</p>
                        </div>
                      </div>
                    </div>))
                )}
              </div>
            </div>
          )}
        </div>

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
              {getRoleShortLabel(user.role)}
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
