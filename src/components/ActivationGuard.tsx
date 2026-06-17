import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import TutorialGuide from "./TutorialGuide"
import Activation from "../pages/Activation"

export function ActivationGuard() {
  const { isAuthenticated, isLoading, user } = useAuth()

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

  if (user && (user.activationStatus === "activated" || user.activationStatus === "已激活")) {
    return <Navigate to="/" replace />
  }

  return (
    <>
      <TutorialGuide />
      <Activation />
    </>
  )
}
