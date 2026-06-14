import type { UserRole } from "../context/AuthContext"
import { getRoleLabel } from "./roleConfig"

export interface ManagedUser {
  id: string
  name: string
  username: string
  role: UserRole
  roleLabel: string
  department: string
  points: number
  status: "已激活" | "待激活" | "已冻结"
  joinDate: string
  phone: string
  banned: boolean
}

function buildDefaultUsers(): ManagedUser[] {
  const mk = (id: string, name: string, username: string, role: UserRole, department: string, points: number, status: "已激活" | "待激活" | "已冻结", joinDate: string, phone: string, banned: boolean): ManagedUser => ({
    id, name, username, role, roleLabel: getRoleLabel(role), department, points, status, joinDate, phone, banned,
  })
  return [
    mk("U005", "赵六", "zhaoliu", "boss", "人事部", 15, "已激活", "2025-03-22", "138****0004", false),
    mk("U006", "孙七", "sunqi", "boss", "人事部", 8, "已激活", "2025-04-05", "138****0005", false),
    mk("U007", "周八", "zhouba", "boss", "人事部", 25, "已激活", "2025-04-18", "138****0006", true),
    mk("U008", "吴九", "wujiu", "boss", "人事部", 30, "已激活", "2025-05-01", "138****0007", false),
    mk("U009", "郑十", "zhengshi", "boss", "人事部", 50, "已激活", "2025-05-12", "138****0008", false),
  ]
}

const DEFAULT_USERS = buildDefaultUsers()

export function loadManageUsers(): ManagedUser[] {
  try {
    const stored = localStorage.getItem("boss-account-users")
    if (stored) return JSON.parse(stored) as ManagedUser[]
  } catch {}
  localStorage.setItem("boss-account-users", JSON.stringify(DEFAULT_USERS))
  return DEFAULT_USERS
}

export function saveManageUsers(users: ManagedUser[]) {
  localStorage.setItem("boss-account-users", JSON.stringify(users))
}

/** 获取用户总积分 */
export function getUserPoints(username: string): number {
  const users = loadManageUsers()
  const u = users.find((x) => x.username === username)
  return u?.points ?? 0
}

/** 从 localStorage 读取通用积分 */
export function getGlobalPoints(): number {
  try { return Number(localStorage.getItem("boss-points")) || 0 } catch { return 0 }
}
