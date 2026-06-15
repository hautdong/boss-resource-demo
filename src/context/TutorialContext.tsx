import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { useAuth } from "./AuthContext"

// ─── 教程步骤 ───
export const TUTORIAL_STEPS = [
  { id: "register",    title: "📝 注册账号",       desc: "注册成功！接下来请完成学习资料阅读" },
  { id: "study",       title: "📖 学习资料",       desc: "请阅读学习资料，了解平台使用规则" },
  { id: "exam",        title: "📝 参加考试",        desc: "学习完成后参加考试，通过后获得姚币" },
  { id: "apply",       title: "📦 申请BOSS资源",     desc: "进入BOSS资源页面，查看可用资源" },
  { id: "exchange",    title: "🎯 兑换VIP账号",     desc: "在资源申请中选择VIP账号，完成兑换" },
  { id: "complete",    title: "🎉 教程完成",          desc: "恭喜！你已完成所有新手教程" },
]

interface TutorialState {
  enabled: boolean
  step: number     // 0=register, 1=study, 2=exam, 3=apply, 4=exchange, 5=complete
}

interface TutorialContextType {
  state: TutorialState
  stepInfo: typeof TUTORIAL_STEPS[0] | null
  progress: number
  next: () => void
  goTo: (stepId: string) => void
  skip: () => void
  finish: () => void
  isActive: boolean
}

const KEY = "boss-tutorial"

function load(): TutorialState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { enabled: false, step: 0 }
}

const TutorialContext = createContext<TutorialContextType | null>(null)

export function TutorialProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [state, setState] = useState<TutorialState>(load)

  // 持久化
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(state)) }, [state])

  // BOSS用户登录后自动开启教程（仅一次，且仅未激活用户）
  // 非BOSS角色自动清空教程状态
  useEffect(() => {
    if (!isAuthenticated || !user) return
    if (state.enabled || state.step >= 5) return
    if (user.role !== "boss") return
    // 已激活的用户不需要教程
    if (user.activationStatus === "activated" || user.activationStatus === "已激活") return

    // 检查是否从未开启过
    const raw = localStorage.getItem(KEY)
    if (!raw || JSON.parse(raw).step === 0 && !JSON.parse(raw).enabled) {
      setState({ enabled: true, step: 0 })
    }
  }, [isAuthenticated, user])

  // 非BOSS用户登录后强制清除教程状态
  useEffect(() => {
    if (user && user.role !== "boss") {
      setState({ enabled: false, step: 0 })
      localStorage.removeItem(KEY)
    }
  }, [user])

  const stepInfo = state.enabled && state.step < 5 ? TUTORIAL_STEPS[state.step] : null
  const progress = state.enabled 
    ? Math.round((state.step / 5) * 100) 
    : state.step >= 5 ? 100 : 0
  const isActive = state.enabled && state.step < 5

  const next = useCallback(() => {
    setState(prev => {
      const step = prev.step + 1
      if (step >= 5) return { enabled: false, step: 5 }
      return { ...prev, step }
    })
  }, [])

  const goTo = useCallback((stepId: string) => {
    const idx = TUTORIAL_STEPS.findIndex(s => s.id === stepId)
    if (idx >= 0) setState({ enabled: true, step: idx })
  }, [])

  const skip = useCallback(() => {
    setState({ enabled: false, step: 5 })
  }, [])

  const finish = useCallback(() => {
    setState({ enabled: false, step: 5 })
  }, [])

  return (
    <TutorialContext.Provider value={{ state, stepInfo, progress, next, goTo, skip, finish, isActive }}>
      {children}
    </TutorialContext.Provider>
  )
}

export function useTutorial() {
  const ctx = useContext(TutorialContext)
  if (!ctx) throw new Error("useTutorial must be used within TutorialProvider")
  return ctx
}
