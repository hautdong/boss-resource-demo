import { useState, useEffect } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Sidebar } from "./Sidebar"
import { TopNav } from "./TopNav"
import { cn } from "../lib/utils"

export function ProtectedLayout() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Check activation: if user is a boss-level role and not activated, redirect to activation
  if (
    user &&
    (user.role === "boss") &&
    user.activationStatus !== "activated" &&
    location.pathname !== "/activation"
  ) {
    return <Navigate to="/activation" replace />
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div
        className={cn(
          "transition-all duration-300",
          // Desktop: adjust for sidebar width
          "lg:pl-60",
          collapsed && "lg:pl-16"
        )}
      >
        <TopNav onMobileMenuToggle={() => setMobileOpen(true)} />
        <main className="p-3 sm:p-4 md:p-6 animate-fade-in max-w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
