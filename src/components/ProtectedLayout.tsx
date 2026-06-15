import { useState, useEffect } from "react"
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useTutorial } from "../context/TutorialContext"
import { Sidebar } from "./Sidebar"
import { TopNav } from "./TopNav"
import TutorialGuide from "./TutorialGuide"
import TutorialOverlay from "./TutorialOverlay"
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
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const tutorial = useTutorial()

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

  const isActivated = user && (user.activationStatus === "activated" || user.activationStatus === "已激活")
  if (!isActivated && location.pathname !== "/activation") {
    return <Navigate to="/activation" replace />
  }

  const requiredPerm = ROUTE_PERMISSIONS[location.pathname]
  if (user && requiredPerm && !hasPermission(user.role, requiredPerm as any)) {
    return <Navigate to="/" replace />
  }

  // ── 教程遮罩配置（步骤4申请资源、步骤5兑换VIP）──
  const getOverlayConfig = () => {
    const sid = tutorial.stepInfo?.id
    const isBoss = user?.role === "boss"
    if (!sid || !tutorial.isActive || !isBoss) return null
    const onResourcesPage = location.pathname === "/resources"

    // 不在资源页且在 sidemenu路径上 → 先导航
    if (!onResourcesPage && (sid === "apply" || sid === "exchange")) {
      return {
        stages: [{
          targetSelector: "#nav-resources",
          title: sid === "apply" ? "📦 申请BOSS资源" : "🎯 兑换VIP账号",
          description: "点击侧边栏的「姚币商城」进入商城页面。",
        }],
      }
    }

    // 在资源页 → 多阶段引导
    if (sid === "apply") {
      return {
        stages: [
          {
            targetSelector: "#resource-tab",
            title: "📦 申请BOSS资源（1/3）",
            description: "点击「资源申请」标签页，进入资源申请界面。",
          },
          {
            targetSelector: "#resource-type-license",
            title: "📦 申请BOSS资源（2/3）",
            description: "点击选择「营业执照」资源类型，系统将自动选中。",
          },
          {
            targetSelector: "#resource-submit-btn",
            title: "📦 申请BOSS资源（3/3）",
            description: "填写申请说明后，点击「提交申请」按钮完成资源申请。",
          },
        ],
      }
    }

    if (sid === "exchange") {
      return {
        stages: [
          {
            targetSelector: "#exchange-tab",
            title: "🎯 兑换VIP账号（1/2）",
            description: "点击「姚币兑换」标签页，进入商品兑换界面。",
          },
          {
            targetSelector: "#vip-exchange-card",
            title: "🎯 兑换VIP账号（2/2）",
            description: "点击 VIP账号 商品卡片，选择数量后确认兑换，即可完成新手教程！",
          },
        ],
      }
    }

    return null
  }
  const overlayConfig = getOverlayConfig()

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
        <main className={`p-3 sm:p-4 md:p-6 animate-fade-in responsive-container ${tutorial.isActive ? "pt-14" : ""}`}>
          <Outlet />
        </main>
      </div>
      <TutorialGuide />
      <TutorialOverlay
        visible={!!overlayConfig}
        stepIndex={tutorial.state.step}
        totalSteps={5}
        stages={overlayConfig?.stages || []}
        interactive={true}
        onNext={() => {
          if (!location.pathname.startsWith("/resources")) {
            navigate("/resources")
          } else {
            tutorial.next()
          }
        }}
        onSkip={tutorial.skip}
      />
    </div>
  )
}
