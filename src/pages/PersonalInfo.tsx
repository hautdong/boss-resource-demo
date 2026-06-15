import { useAuth } from "../context/AuthContext"
import { getRoleLabel, getRoleColorClass } from "../lib/roleConfig"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import {
  UserCircle, Shield, Phone, Key, CheckCircle2, Clock,
  Award, Mail
} from "lucide-react"

export default function PersonalInfo() {
  const { user } = useAuth()

  if (!user) return null

  const statusConfig = {
    activated: { label: "已激活", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
    pending: { label: "待激活", icon: Clock, color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-900/30" },
    studying: { label: "学习中", icon: Clock, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30" },
    ready: { label: "待考试", icon: Clock, color: "text-indigo-500", bg: "bg-indigo-100 dark:bg-indigo-900/30" },
  }
  const status = statusConfig[user.activationStatus] || statusConfig.pending
  const StatusIcon = status?.icon || Clock

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight gradient-text">个人信息</h1>
          <p className="text-sm text-muted-foreground mt-1">查看您的账号信息</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Profile Card ── */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
                <UserCircle className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-lg font-bold">{user.name}</h2>
              <p className="text-sm text-muted-foreground">@{user.username}</p>

              <div className="flex items-center gap-2 mt-3">
                <Badge className={getRoleColorClass(user.role)}>{getRoleLabel(user.role)}</Badge>
              </div>

              <div className={`mt-3 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${status.bg} ${status.color}`}>
                <StatusIcon className="h-3.5 w-3.5" />
                {status.label}
              </div>

              {user.examScore !== undefined && (
                <div className="mt-3 text-xs text-muted-foreground">
                  考试成绩：<span className={user.examPassed ? "text-emerald-600 font-semibold" : "text-destructive font-semibold"}>{user.examScore}</span>/100
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Detail Info ── */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  账号详情
                </CardTitle>
                <CardDescription className="mt-1">基本信息与账号状态</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {/* Row: ID */}
              <div className="flex items-center gap-4 py-3 border-b">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Key className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">账号ID</p>
                  <p className="text-sm font-medium">{user.id}</p>
                </div>
              </div>

              {/* Row: Name */}
              <div className="flex items-center gap-4 py-3 border-b">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <UserCircle className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">真实姓名</p>
                  <p className="text-sm font-medium">{user.name}</p>
                </div>
              </div>

              {/* Row: Username */}
              <div className="flex items-center gap-4 py-3 border-b">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">登录用户名</p>
                  <p className="text-sm font-medium">@{user.username}</p>
                </div>
              </div>

              {/* Row: Phone (read-only) */}
              <div className="flex items-center gap-4 py-3 border-b">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">手机号</p>
                  <p className="text-sm font-medium">{user.phone || "未填写"}</p>
                </div>
              </div>

              {/* Row: Department */}
              <div className="flex items-center gap-4 py-3 border-b">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">所属部门</p>
                  <p className="text-sm font-medium">{user.department}</p>
                </div>
              </div>

              {/* Row: Role */}
              <div className="flex items-center gap-4 py-3 border-b">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Award className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">系统角色</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge className={getRoleColorClass(user.role)}>{getRoleLabel(user.role)}</Badge>
                  </div>
                </div>
              </div>

              {/* Row: Activation Status */}
              <div className="flex items-center gap-4 py-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${status.bg}`}>
                  <StatusIcon className={`h-4 w-4 ${status.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">账号状态</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-sm font-medium ${status.color}`}>{status.label}</span>
                    {user.activationStatus === "pending" && (
                      <span className="text-xs text-muted-foreground">— 请完成激活考试</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
