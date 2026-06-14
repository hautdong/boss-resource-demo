import { useState, useEffect } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useTutorial } from "../context/TutorialContext"
import { Sidebar } from "./Sidebar"
import { TopNav } from "./TopNav"
import TutorialGuide from "./TutorialGuide"
import { cn } from "../lib/utils"
import { hasPermission } from "../lib/permissions"

const ROUTE_PERMISSIONS: Record<string, string> = {
  "/": "view_dashboard",
  "/profile": "view_profile",
  "/management": "view_management",
  "/resources": "view_resources",
  "/statistics": "view_statistics",
  "/logs": "view_logs",
  "/bugs": "view_bugs",
}

export function ProtectedLayout() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isActive: tutorialActive } = useTutorial()

  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center animate-pulse-soft">
          <div className="mx-auto h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (user && user.activationStatus !== "activated" && location.pathname !== "/activation") {
    return <Navigate to="/activation" replace />
  }

  const requiredPerm = ROUTE_PERMISSIONS[location.pathname]
  if (user && requiredPerm && !hasPermission(user.role, requiredPerm as any)) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-background relative">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        userRole={user?.role}
      />
      <div className={cn("transition-all duration-300", "lg:pl-60", collapsed && "lg:pl-16")}>
        <TopNav onMobileMenuToggle={() => setMobileOpen(true)} />
        <main className={`p-3 sm:p-4 md:p-6 animate-fade-in responsive-container ${tutorialActive ? "pt-14" : ""}`}>
          <Outlet />
        </main>
      </div>
      {/* 教程引导层 */}
      <TutorialGuide />
    </div>
  )
}
