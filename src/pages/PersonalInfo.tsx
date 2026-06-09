import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Badge } from "../components/ui/badge"
import {
  UserCircle, Shield, Phone, Key, CheckCircle2, Clock,
  Edit3, Save, X, Award, Mail
} from "lucide-react"

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  boss: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: "超级管理员",
  admin: "管理员",
  boss: "成员BOSS",
}

const LEVEL_COLORS: Record<string, string> = {
  L1: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  L2: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300",
  L3: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300",
}

export default function PersonalInfo() {
  const { user } = useAuth()
  const [editing, setEditing] = useState(false)
  const [phone, setPhone] = useState(user?.phone || "")
  const [saved, setSaved] = useState(false)

  if (!user) return null

  const handleSave = () => {
    // In a real app, this would call an API
    setSaved(true)
    setEditing(false)
    setTimeout(() => setSaved(false), 2000)
  }

  const statusConfig = {
    activated: { label: "已激活", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
    pending: { label: "待激活", icon: Clock, color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-900/30" },
    studying: { label: "学习中", icon: Clock, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30" },
    ready: { label: "待考试", icon: Clock, color: "text-indigo-500", bg: "bg-indigo-100 dark:bg-indigo-900/30" },
  }
  const status = statusConfig[user.activationStatus]
  const StatusIcon = status.icon

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight gradient-text">个人信息</h1>
          <p className="text-sm text-muted-foreground mt-1">查看和编辑您的账号信息</p>
        </div>
        {saved && (
          <Badge variant="success" className="animate-fade-in">
            <CheckCircle2 className="h-3 w-3 mr-1" />保存成功
          </Badge>
        )}
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
                <Badge className={ROLE_COLORS[user.role]}>{ROLE_LABELS[user.role]}</Badge>
                <Badge className={LEVEL_COLORS[user.level] || "bg-muted"}>{user.level}</Badge>
              </div>

              <div className={`mt-3 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${status.bg} ${status.color}`}>
                <StatusIcon className="h-3.5 w-3.5" />
                {status.label}
              </div>

              {user.examScore !== undefined && (
                <div className="mt-3 text-xs text-muted-foreground">
                  考试成绩：<span className={user.examPassed ? "text-emerald-600 font-semibold" : "text-destructive font-semibold"}>{user.examScore}</span>/230
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
              <Button
                variant={editing ? "destructive" : "outline"}
                size="sm"
                onClick={() => {
                  if (editing) {
                    setPhone(user.phone)
                  }
                  setEditing(!editing)
                }}
              >
                {editing ? (
                  <><X className="h-4 w-4 mr-1" />取消</>
                ) : (
                  <><Edit3 className="h-4 w-4 mr-1" />编辑</>
                )}
              </Button>
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

              {/* Row: Phone (editable) */}
              <div className="flex items-center gap-4 py-3 border-b">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">手机号</p>
                  {editing ? (
                    <Input
                      placeholder="请输入11位手机号"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                      className="mt-1 h-9"
                    />
                  ) : (
                    <p className="text-sm font-medium">{user.phone || "未填写"}</p>
                  )}
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
                    <Badge className={ROLE_COLORS[user.role]}>{ROLE_LABELS[user.role]}</Badge>
                    <span className="text-xs text-muted-foreground">级别 {user.level}</span>
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

            {editing && (
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => { setPhone(user.phone); setEditing(false) }}>
                  取消
                </Button>
                <Button variant="primary" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-1" />保存修改
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
