import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { authApi, setToken } from "../lib/api"

export type UserRole = "super_admin" | "admin" | "boss"
export type ActivationStatus = "pending" | "studying" | "ready" | "activated"

export interface User {
  id: string
  name: string
  username: string
  phone: string
  department: string
  role: UserRole
  roleLabel: string
  level: string
  activationStatus: ActivationStatus
  examScore?: number
  examPassed?: boolean
  createdAt?: string
}

interface RegisterData {
  name: string
  username: string
  phone: string
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

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Restore session from token
  useEffect(() => {
    const token = localStorage.getItem("boss-resource-token")
    if (token) {
      setToken(token)
      authApi.me()
        .then((data) => {
          setUser(data.user)
        })
        .catch(() => {
          // Token invalid, clear it
          setToken(null)
          localStorage.removeItem("boss-resource-token")
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    try {
      const data = await authApi.login(username, password)
      setToken(data.token)
      setUser(data.user)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || "登录失败" }
    }
  }, [])

  const register = useCallback(async (data: RegisterData) => {
    try {
      const result = await authApi.register(data)
      setToken(result.token)
      setUser(result.user)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || "注册失败" }
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
  }, [])

  const updateActivationStatus = useCallback(async (status: ActivationStatus) => {
    if (!user) return
    try {
      const data = await authApi.updateActivation({ status })
      setUser(data.user)
    } catch {
      // Fallback: update locally
      const updated = { ...user, activationStatus: status }
      setUser(updated)
    }
  }, [user])

  const completeExam = useCallback(async (score: number, passed: boolean) => {
    if (!user) return
    try {
      const status = passed ? "activated" as const : "pending" as const
      const data = await authApi.updateActivation({ status, examScore: score, examPassed: passed })
      setUser(data.user)
    } catch {
      // Fallback
      const updated = {
        ...user,
        activationStatus: passed ? "activated" as const : "pending" as const,
        examScore: score,
        examPassed: passed,
      }
      setUser(updated)
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
