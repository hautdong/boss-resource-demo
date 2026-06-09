import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"

export type UserRole = "super_admin" | "admin" | "boss"
export type ActivationStatus = "pending" | "studying" | "ready" | "activated"

export interface User {
  id: string
  name: string          // 真实姓名（中文）
  username: string      // 登录用户名
  phone: string
  department: string
  role: UserRole
  roleLabel: string
  level: string
  activationStatus: ActivationStatus
  examScore?: number
  examPassed?: boolean
}

interface RegisterData {
  name: string          // 真实姓名
  username: string      // 登录用户名
  phone: string         // 手机号
  password: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateActivationStatus: (status: ActivationStatus) => void
  completeExam: (score: number, passed: boolean) => void
}

// ── Pre-seeded users based on user's table ──
// 林伶俐 → 超管 (super_admin)
// 林锦超 → 管理员 (admin)
// 黄文凤 → 成员BOSS (boss)
const PRESET_USERS: Record<string, { user: User; password: string }> = {
  "hwf": {
    password: "13141314",
    user: {
      id: "U001",
      name: "黄文凤",
      username: "hwf",
      phone: "",
      department: "成员BOSS",
      role: "boss",
      roleLabel: "成员BOSS",
      level: "L1",
      activationStatus: "pending",
    },
  },
  "lll": {
    password: "admin123",
    user: {
      id: "U002",
      name: "林伶俐",
      username: "lll",
      phone: "",
      department: "总部",
      role: "super_admin",
      roleLabel: "超级管理员",
      level: "L3",
      activationStatus: "activated",
    },
  },
  "ljc": {
    password: "admin123",
    user: {
      id: "U003",
      name: "林锦超",
      username: "ljc",
      phone: "",
      department: "总部",
      role: "admin",
      roleLabel: "管理员",
      level: "L2",
      activationStatus: "activated",
    },
  },
}

function loadUsers(): Record<string, { user: User; password: string }> {
  try {
    const stored = localStorage.getItem("boss-resource-users")
    if (stored) {
      const custom = JSON.parse(stored)
      return { ...PRESET_USERS, ...custom }
    }
  } catch {}
  return PRESET_USERS
}

function saveUsers(users: Record<string, { user: User; password: string }>) {
  const custom: Record<string, { user: User; password: string }> = {}
  for (const [username, data] of Object.entries(users)) {
    if (!PRESET_USERS[username]) {
      custom[username] = data
    }
  }
  localStorage.setItem("boss-resource-users", JSON.stringify(custom))
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Restore session
  useEffect(() => {
    try {
      const stored = localStorage.getItem("boss-resource-session")
      if (stored) {
        setUser(JSON.parse(stored))
      }
    } catch {}
    setIsLoading(false)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const users = loadUsers()
    const record = users[username]

    if (!record) {
      return { success: false, error: "账号不存在，请检查用户名或注册新账号" }
    }
    if (record.password !== password) {
      return { success: false, error: "密码错误，请重试" }
    }

    setUser(record.user)
    localStorage.setItem("boss-resource-session", JSON.stringify(record.user))
    return { success: true }
  }, [])

  const register = useCallback(async (data: RegisterData) => {
    const users = loadUsers()

    if (!data.name || !data.username || !data.password) {
      return { success: false, error: "请填写所有必填字段" }
    }
    if (data.username.length < 2 || data.username.length > 20) {
      return { success: false, error: "用户名长度应为 2-20 个字符" }
    }
    if (data.password.length < 6) {
      return { success: false, error: "密码长度至少 6 位" }
    }
    if (users[data.username]) {
      return { success: false, error: "该用户名已被注册" }
    }

    // Auto-assign role based on username rules from the user's table
    // 黄文凤→boss, all others default to boss for new registrations
    const newUser: User = {
      id: `U${String(Object.keys(users).length + 1).padStart(3, "0")}`,
      name: data.name,
      username: data.username,
      phone: data.phone || "",
      department: "成员BOSS",
      role: "boss",
      roleLabel: "成员BOSS",
      level: "L1",
      activationStatus: "pending",
    }

    users[data.username] = { user: newUser, password: data.password }
    saveUsers(users)

    // Auto-login
    setUser(newUser)
    localStorage.setItem("boss-resource-session", JSON.stringify(newUser))
    return { success: true }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem("boss-resource-session")
  }, [])

  const updateActivationStatus = useCallback((status: ActivationStatus) => {
    if (!user) return
    const updated = { ...user, activationStatus: status }
    setUser(updated)
    localStorage.setItem("boss-resource-session", JSON.stringify(updated))

    // Also update in users store
    const users = loadUsers()
    if (users[user.username]) {
      users[user.username].user = updated
      saveUsers(users)
    }
  }, [user])

  const completeExam = useCallback((score: number, passed: boolean) => {
    if (!user) return
    const updated = {
      ...user,
      activationStatus: passed ? "activated" as const : "pending" as const,
      examScore: score,
      examPassed: passed,
    }
    setUser(updated)
    localStorage.setItem("boss-resource-session", JSON.stringify(updated))

    const users = loadUsers()
    if (users[user.username]) {
      users[user.username].user = updated
      saveUsers(users)
    }
  }, [user])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateActivationStatus,
        completeExam,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

export function useRequireAuth() {
  const auth = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      navigate("/login", { replace: true })
    }
  }, [auth.isLoading, auth.isAuthenticated, navigate])

  return auth
}
