import { useState, useCallback, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import {
  Shield, Ban, CheckCircle, Info, UserCircle,
  ArrowUpCircle, ArrowDownCircle, Star, Gift, Loader2, RefreshCw
} from "lucide-react"
import { useAuth, type UserRole } from "../context/AuthContext"
import { api } from "../lib/api"

// ─── API 返回的用户类型 ───
interface CloudUser {
  id: string
  username: string
  name: string
  phone: string | null
  department: string | null
  role: UserRole
  roleLabel: string
  activationStatus: string  // "已激活" | "待激活"
  examScore: number | null
  examPassed: boolean
  joinDate: string | null
  points: number
  banned: boolean
}

const POINTS_ADJUST = 5

// ─── 激活状态规范化 ───
function isActiveStatus(status: string): boolean {
  return status === "activated" || status === "已激活"
}
function normalizeStatus(status: string): string {
  return isActiveStatus(status) ? "已激活" : "待激活"
}

// ═══════════════════════════════════════════════
// BossSelfView — BOSS 看自己的信息
// ═══════════════════════════════════════════════
function BossSelfView() {
  const { user } = useAuth()
  const [myData, setMyData] = useState<CloudUser | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMyData = useCallback(async () => {
    try {
      setLoading(true)
      // BOSS 用户通过 auth.me 接口查自己的信息
      const data = await api.auth.me()
      const userData = data.user || data
      setMyData(userData)
    } catch (e) {
      console.error("获取用户数据失败:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMyData() }, [fetchMyData])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!myData) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        <UserCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
        <p>暂无账号数据</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={fetchMyData}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" />重新加载
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
              <UserCircle className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-xl font-bold">{myData.name}</h2>
            <p className="text-sm text-muted-foreground">@{myData.username}</p>

            <div className="flex items-center gap-2 mt-3">
              <Badge variant="outline" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                {myData.roleLabel}
              </Badge>
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">
                <Star className="h-3 w-3 mr-1 fill-amber-500" />
                {myData.points} 姚币
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Points Info */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            </div>
            <div>
              <CardTitle className="text-base">我的姚币</CardTitle>
              <CardDescription>姚币可用于兑换VIP账号和道具</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-5xl font-bold gradient-text mb-2">{myData.points}</div>
            <p className="text-sm text-muted-foreground">当前可用姚币</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4 mt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Gift className="h-4 w-4 text-amber-500" />
              <span>姚币获取途径：完成激活考试、活跃使用系统、参与活动等</span>
            </div>
          </div>

          {myData.banned && (
            <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3 flex items-center gap-2">
              <Ban className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-xs text-destructive font-medium">账号已被封禁，请联系管理员</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            账号信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: "姓名", value: myData.name },
              { label: "用户名", value: `@${myData.username}` },
              { label: "手机号", value: myData.phone || "-" },
              { label: "部门", value: myData.department || "-" },
              { label: "角色", value: myData.roleLabel },
              { label: "当前姚币", value: `${myData.points} 币` },
              { label: "激活状态", value: normalizeStatus(myData.activationStatus) === "已激活" ? "✅ 已激活" : "⏳ 待激活" },
              { label: "考试状态", value: myData.examPassed ? `✅ 已通过 (${myData.examScore}分)` : "未通过" },
              { label: "注册日期", value: myData.joinDate ? new Date(myData.joinDate).toLocaleDateString("zh-CN") : "-" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-sm font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════
// UserTableView — 超管/管理员视角
// ═══════════════════════════════════════════════
function UserTableView({ role, statusFilter }: { role: UserRole; statusFilter?: "active" | "pending" | "all" }) {
  const [users, setUsers] = useState<CloudUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError("")
      const data = await api.admin.users()
      setUsers(data)
    } catch (e: any) {
      setError(e.message || "获取用户数据失败")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  // Filter
  const visibleUsers = useMemo(() => {
    let filtered = users
    if (role !== "super_admin") {
      filtered = filtered.filter((u) => u.role === "boss")
    }
    if (statusFilter === "active") {
      filtered = filtered.filter((u) => isActiveStatus(u.activationStatus))
    } else if (statusFilter === "pending") {
      filtered = filtered.filter((u) => !isActiveStatus(u.activationStatus))
    }
    return filtered
  }, [role, users, statusFilter])

  // 激活/取消激活
  const handleToggleActivation = useCallback(async (userId: string, currentStatus: string) => {
    try {
      setActionLoading(userId)
      const newStatus = isActiveStatus(currentStatus) ? "待激活" : "已激活"
      await api.admin.updateUser(userId, { activationStatus: newStatus })
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? {
          ...u,
          activationStatus: newStatus,
          // 取消激活时同步清除考试状态，保持一致
          examPassed: newStatus === "已激活" ? u.examPassed : false,
          examScore: newStatus === "已激活" ? u.examScore : 0,
        } : u))
      )
    } catch (e: any) {
      alert("操作失败: " + (e.message || "未知错误"))
    } finally {
      setActionLoading(null)
    }
  }, [])

  // 积分调整
  const handleAdjustPoints = useCallback(async (userId: string, direction: "add" | "subtract") => {
    try {
      setActionLoading(userId)
      const amount = direction === "add" ? POINTS_ADJUST : -POINTS_ADJUST
      const user = users.find((u) => u.id === userId)
      if (!user) return
      if (direction === "subtract" && user.points < POINTS_ADJUST) {
        alert("积分不足，无法扣减")
        return
      }
      const result = await api.points.add(userId, amount, "管理员调整", "admin")
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, points: result.total } : u))
      )
    } catch (e: any) {
      alert("操作失败: " + (e.message || "未知错误"))
    } finally {
      setActionLoading(null)
    }
  }, [users])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-24">
          <p className="text-destructive mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchUsers}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" />重试
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">用户列表</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={fetchUsers} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
              刷新
            </Button>
            <Badge variant="outline">共 {visibleUsers.length} 名用户</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用户名</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>部门</TableHead>
              <TableHead>姚币</TableHead>
              <TableHead>激活状态</TableHead>
              <TableHead>考试</TableHead>
              <TableHead>注册日期</TableHead>
              {role === "super_admin" && <TableHead className="text-right">姚币操作</TableHead>}
              <TableHead className="text-right">激活管理</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleUsers.map((u, i) => (
              <TableRow key={u.id} className="animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                <TableCell>
                  <div>
                    <p className="font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.username}{u.phone ? ` · ${u.phone}` : ""}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={u.role === "super_admin" ? "primary" : u.role === "admin" ? "secondary" : "outline"}
                    className="text-[10px]"
                  >
                    {u.roleLabel}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{u.department || "-"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-medium">{u.points}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={isActiveStatus(u.activationStatus) ? "success" : "secondary"}
                    className="text-[10px]"
                  >
                    {normalizeStatus(u.activationStatus)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {u.examPassed ? (
                    <Badge variant="success" className="text-[10px]">✅ {u.examScore}分</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">未通过</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {u.joinDate ? new Date(u.joinDate).toLocaleDateString("zh-CN") : "-"}
                </TableCell>

                {/* Super admin: points adjustment */}
                {role === "super_admin" && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        onClick={() => handleAdjustPoints(u.id, "add")}
                        disabled={actionLoading === u.id}
                        title={`增加 ${POINTS_ADJUST} 姚币`}
                      >
                        <ArrowUpCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                        onClick={() => handleAdjustPoints(u.id, "subtract")}
                        disabled={u.points <= 0 || actionLoading === u.id}
                        title={`减少 ${POINTS_ADJUST} 姚币`}
                      >
                        <ArrowDownCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}

                <TableCell className="text-right">
                  {actionLoading === u.id ? (
                    <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                  ) : isActiveStatus(u.activationStatus) ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleToggleActivation(u.id, u.activationStatus)}
                      title="取消激活"
                    >
                      <Ban className="h-3.5 w-3.5 mr-1" />
                      <span className="text-xs">取消激活</span>
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                      onClick={() => handleToggleActivation(u.id, u.activationStatus)}
                      title="激活账号"
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      <span className="text-xs">激活</span>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {visibleUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={role === "super_admin" ? 9 : 7} className="text-center py-12 text-muted-foreground">
                  暂无用户数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// ═══════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════
export default function AccountManagement() {
  const { user } = useAuth()
  if (!user) return null

  const isBoss = user.role === "boss"
  const isAdmin = user.role === "admin"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight gradient-text">账号管理</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isBoss
            ? "查看我的账号信息与姚币"
            : isAdmin
            ? "管理成员BOSS账号，控制激活状态"
            : "管理所有用户账号、姚币与激活状态"}
        </p>
      </div>

      {isBoss ? (
        <BossSelfView />
      ) : (
        <Tabs defaultValue="all">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">全部用户</TabsTrigger>
              <TabsTrigger value="active">已激活</TabsTrigger>
              <TabsTrigger value="pending">待激活</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-4">
            <UserTableView role={user.role} statusFilter="all" />
          </TabsContent>
          <TabsContent value="active" className="mt-4">
            <UserTableView role={user.role} statusFilter="active" />
          </TabsContent>
          <TabsContent value="pending" className="mt-4">
            <UserTableView role={user.role} statusFilter="pending" />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
