import type { UserRole } from "../context/AuthContext"

/**
 * 角色配置中心 — 角色标签、颜色、默认信息的唯一来源
 *
 * 使用方式：
 *   import { ROLE_CONFIG, getRoleLabel, getRoleShortLabel, getRoleColor, getDefaultDepartment } from "@/lib/roleConfig"
 */

export interface RoleMeta {
  /** 完整中文标签，如"成员BOSS" */
  label: string
  /** 导航栏短标签，如"成员" */
  shortLabel: string
  /** Badge CSS 类名颜色标识 */
  colorClass: string
  /** 该角色默认部门 */
  defaultDepartment: string
}

export const ROLE_CONFIG: Record<UserRole, RoleMeta> = {
  super_admin: {
    label: "超级管理员",
    shortLabel: "超管",
    colorClass: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    defaultDepartment: "行政部",
  },
  admin: {
    label: "管理员",
    shortLabel: "管理",
    colorClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    defaultDepartment: "运营部",
  },
  boss: {
    label: "成员BOSS",
    shortLabel: "成员",
    colorClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    defaultDepartment: "运营部",
  },
  developer: {
    label: "开发者",
    shortLabel: "开发",
    colorClass: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    defaultDepartment: "技术部",
  },
}

/** 根据角色获取完整标签 */
export function getRoleLabel(role: UserRole): string {
  return ROLE_CONFIG[role]?.label ?? "未知角色"
}

/** 根据角色获取导航栏短标签 */
export function getRoleShortLabel(role: UserRole): string {
  return ROLE_CONFIG[role]?.shortLabel ?? "未知"
}

/** 根据角色获取 Badge 颜色类名 */
export function getRoleColorClass(role: UserRole): string {
  return ROLE_CONFIG[role]?.colorClass ?? ""
}

/** 根据角色获取默认部门 */
export function getDefaultDepartment(role: UserRole): string {
  return ROLE_CONFIG[role]?.defaultDepartment ?? ""
}

/**
 * 根据真实姓名匹配角色
 * 不在名单中的人员默认分配为成员BOSS
 */
const NAME_ROLE_MAP: Partial<Record<string, UserRole>> = {
  "超管测试": "super_admin",
  "管理员测试": "admin",
  "成员BOSS测试": "boss",
}

/** 根据姓名查找对应角色，未匹配则返回 boss */
export function matchRoleByName(name: string): UserRole {
  return NAME_ROLE_MAP[name] ?? "boss"
}
