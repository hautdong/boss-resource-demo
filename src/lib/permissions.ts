import type { UserRole } from "../context/AuthContext"

/**
 * 权限定义 — 基于 BOSS直聘企业后台管理使用手册
 *
 * 开发者（developer）：全部权限 + 编辑模式
 * 超管（super_admin）：全部权限
 * 管理员（admin）：企业管理功能可见，部分受限
 * 成员BOSS（boss）：无企业管理菜单
 */

export type Permission =
  | "view_dashboard"
  | "view_profile"
  | "view_management"     // 账号管理
  | "view_resources"      // BOSS资源
  | "view_statistics"     // 数据统计
  | "view_logs"           // 操作日志
  | "view_bugs"           // Bug记录
  | "manage_users"        // 管理员管理/封禁
  | "view_all_logs"       // 查看所有人操作日志
  | "reassign_resources"  // 重新分配资源
  | "reclaim_resources"   // 回收资源
  | "view_totals"         // 总量统计（超管独享）

const PERMISSION_MAP: Record<UserRole, Permission[]> = {
  super_admin: [
    "view_dashboard",
    "view_profile",
    "view_management",
    "view_resources",
    "view_statistics",
    "view_logs",
    "view_bugs",
    "manage_users",
    "view_all_logs",
    "reassign_resources",
    "reclaim_resources",
    "view_totals",
  ],
  admin: [
    "view_dashboard",
    "view_profile",
    "view_management",
    "view_resources",
    "view_statistics",
    "view_logs",
    "view_bugs",
  ],
  boss: [
    "view_dashboard",
    "view_profile",
    "view_resources",
    "view_bugs",
  ],
  developer: [
    "view_dashboard",
    "view_profile",
    "view_management",
    "view_resources",
    "view_statistics",
    "view_logs",
    "view_bugs",
    "manage_users",
    "view_all_logs",
    "reassign_resources",
    "reclaim_resources",
    "view_totals",
  ],
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return PERMISSION_MAP[role]?.includes(permission) ?? false
}

/**
 * 获取当前角色可见的导航项列表
 */
export function getVisibleNavItems(role: UserRole) {
  const items = [
    { to: "/", label: "工作台", permission: "view_dashboard" as Permission },
    { to: "/profile", label: "个人信息", permission: "view_profile" as Permission },
    { to: "/management", label: "账号管理", permission: "view_management" as Permission },
    { to: "/resources", label: "姚币商城", permission: "view_resources" as Permission },
    { to: "/statistics", label: "数据统计", permission: "view_statistics" as Permission },
    { to: "/logs", label: "操作日志", permission: "view_logs" as Permission },
    { to: "/bugs", label: "Bug记录", permission: "view_bugs" as Permission },
  ]
  return items.filter((item) => hasPermission(role, item.permission))
}
