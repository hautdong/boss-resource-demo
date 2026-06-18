import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { useAuth } from "./AuthContext"
import { api } from "../lib/api"

// ─── 教程步骤 ───
export const TUTORIAL_STEPS = [
  { id: "register", title: "注册账号",       desc: "注册成功！接下来请完成学习资料阅读" },
  { id: "study",    title: "学习资料",       desc: "请阅读学习资料，了解平台使用规则" },
  { id: "exam",     title: "参加考试",        desc: "学习完成后参加考试，通过后可申请资源" },
  { id: "apply",    title: "申请BOSS账号",     desc: "考试通过，请进入BOSS资源页面申请账号" },
  { id: "complete", title: "完成新手教程",     desc: "恭喜！你已完成所有新手教程" },
]

interface TutorialState {
  enabled: boolean
  step: number     // 0=register, 1=study, 2=exam, 3=apply, 4=complete
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

const KEY_PREFIX = "boss-tutorial"

function getUserKey(userId: string) {
  return `${KEY_PREFIX}-${userId}`
}

function load(userId?: string): TutorialState {
  const key = userId ? getUserKey(userId) : KEY_PREFIX
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { enabled: false, step: 0 }
}

const TutorialContext = createContext<TutorialContextType | null>(null)

export function TutorialProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const userId = user?.id || ""
  const [state, setState] = useState<TutorialState>(() => load(userId))

  // 从云端加载教程进度，覆盖本地缓存
  useEffect(() => {
    if (!userId) return
    api.tutorial.get(userId).then(data => {
      if (data && typeof data.step === 'number') {
        const serverState: TutorialState = { step: data.step, enabled: !!data.enabled }
        // 仅当服务端有值时才覆盖本地（本地可能还没初始化）
        const key = getUserKey(userId)
        const raw = localStorage.getItem(key)
        if (!raw || (data.step !== 0 || data.enabled)) {
          setState(serverState)
          localStorage.setItem(key, JSON.stringify(serverState))
        }
      }
    }).catch(() => {})
  }, [userId])

  // 用户切换时重新加载对应用户的教程状态
  useEffect(() => {
    if (!userId) return
    setState(load(userId))
  }, [userId])

  // 持久化到本地 + 同步到云端
  useEffect(() => {
    if (!userId) return
    const key = getUserKey(userId)
    localStorage.setItem(key, JSON.stringify(state))
    // 异步同步到云端（静默失败）
    api.tutorial.save(userId, { step: state.step, enabled: state.enabled }).catch(() => {})
  }, [state, userId])

  // BOSS用户登录后自动开启教程（仅一次，且仅未激活用户）
  // 非BOSS角色自动清空教程状态
  useEffect(() => {
    if (!isAuthenticated || !user) return
    if (state.enabled || state.step >= 4) return
    if (user.role !== "boss") return
    // 已激活的用户不需要教程
    if (user.activationStatus === "activated" || user.activationStatus === "已激活") return

    // 检查是否从未开启过
    const key = getUserKey(user.id)
    const raw = localStorage.getItem(key)
    if (!raw || (JSON.parse(raw).step === 0 && !JSON.parse(raw).enabled)) {
      setState({ enabled: true, step: 0 })
    }
  }, [isAuthenticated, user, state.enabled, state.step])

  // 非BOSS用户登录后强制清除教程状态
  useEffect(() => {
    if (user && user.role !== "boss") {
      const key = getUserKey(user.id)
      setState({ enabled: false, step: 0 })
      localStorage.removeItem(key)
    }
  }, [user])

  const stepInfo = state.enabled && state.step < 4 ? TUTORIAL_STEPS[state.step] : null
  const progress = state.enabled 
    ? Math.round((state.step / 4) * 100) 
    : state.step >= 4 ? 100 : 0
  const isActive = state.enabled && state.step < 4

  const next = useCallback(() => {
    setState(prev => {
      const step = prev.step + 1
      if (step >= 4) return { enabled: false, step: 4 }
      return { ...prev, step }
    })
  }, [])

  const goTo = useCallback((stepId: string) => {
    const idx = TUTORIAL_STEPS.findIndex(s => s.id === stepId)
    if (idx >= 0) setState(prev => ({ ...prev, step: idx }))
  }, [])

  const skip = useCallback(() => {
    setState({ enabled: false, step: 4 })
  }, [])

  const finish = useCallback(() => {
    setState({ enabled: false, step: 4 })
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
