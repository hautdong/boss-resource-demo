import { useState, useMemo, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { api } from "../lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Download, Trophy, Users, Star, Filter } from "lucide-react"

interface RankUser {
  id: string
  name: string
  username: string
  phone: string
  department: string
  roleLabel: string
  points: number
  lastPointsTime: string
}

function loadRealUsers(): RankUser[] {
  try {
    const raw = localStorage.getItem("boss-resource-users")
    if (!raw) return []
    const allUsers = JSON.parse(raw)
    const entries = Object.entries(allUsers) as [string, any][]

    return entries
      .map(([, entry]) => {
        const u = entry.user || entry
        if (u.role !== "boss") return null

        const userKey = `${u.name || ""}-${u.phone || u.username || ""}`
        const points = (() => {
          try { return Number(localStorage.getItem(`boss-points-${userKey}`)) || 0 } catch { return 0 }
        })()
        const lastPointsTime = (() => {
          try { return localStorage.getItem(`boss-points-last-time-${userKey}`) || "" } catch { return "" }
        })()

        return {
          id: u.id,
          name: u.name || "",
          username: u.username || "",
          phone: u.phone || "",
          department: u.department || "未分配",
          roleLabel: u.roleLabel || "成员BOSS",
          points,
          lastPointsTime,
        }
      })
      .filter(Boolean) as RankUser[]
  } catch {
    return []
  }
}

export default function DataStatistics() {
  const { user } = useAuth()
  const [users, setUsers] = useState<RankUser[]>([])
  const isAdmin = user?.role === "super_admin" || user?.role === "admin"

  // 优先从 API 加载，失败降级到 localStorage
  useEffect(() => {
    api.stats.ranking()
      .then((data: any[]) => {
        const mapped: RankUser[] = data.map((u: any) => ({
          id: u.id, name: u.name || "", username: u.username || "",
          phone: u.phone || "", department: u.department || "未分配",
          roleLabel: u.roleLabel || "成员BOSS", points: u.points || 0,
          lastPointsTime: u.lastPointsTime || "",
        }))
        setUsers(mapped)
      })
      .catch(() => {
        // API 不可用，降级到 localStorage
        setUsers(loadRealUsers())
      })
  }, [])

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      // 末次获得姚币时间更早的排前面
      if (a.lastPointsTime && b.lastPointsTime) {
        return new Date(a.lastPointsTime).getTime() - new Date(b.lastPointsTime).getTime()
      }
      if (a.lastPointsTime) return -1
      if (b.lastPointsTime) return 1
      return 0
    })
  }, [users])

  const departments = useMemo(() => {
    const deps = new Set(users.map((u) => u.department).filter(Boolean))
    return Array.from(deps).sort()
  }, [users])

  const [departmentFilter, setDepartmentFilter] = useState<string>("all")

  const filteredUsers = useMemo(() => {
    if (departmentFilter === "all") return sortedUsers
    return sortedUsers.filter((u) => u.department === departmentFilter)
  }, [sortedUsers, departmentFilter])

  const totalBoss = sortedUsers.length
  const totalPoints = sortedUsers.reduce((s, u) => s + u.points, 0)
  const avgPoints = totalBoss > 0 ? (totalPoints / totalBoss).toFixed(1) : "0"

  const handleExport = () => {
    const rows = [["排名", "姓名", "部门", "姚币", "末次获得时间"]]
    filteredUsers.forEach((u, i) => {
      const timeStr = u.lastPointsTime
        ? new Date(u.lastPointsTime).toLocaleString("zh-CN")
        : "未获得"
      rows.push([String(i + 1), u.name, u.department, String(u.points), timeStr])
    })
    const csv = rows.map((r) => r.join(",")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = "BOSS姚币排名.csv"; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight gradient-text">数据统计</h1>
        <p className="text-sm text-muted-foreground mt-1">BOSS 姚币排名</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-muted-foreground">BOSS 总人数</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalBoss}</p>
            <p className="text-xs text-muted-foreground mt-1">活跃 BOSS 成员</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-muted-foreground">总姚币</CardTitle>
            <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalPoints}</p>
            <p className="text-xs text-muted-foreground mt-1">全部门累计</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-muted-foreground">平均姚币</CardTitle>
            <Trophy className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{avgPoints}</p>
            <p className="text-xs text-muted-foreground mt-1">人均姚币</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-base">BOSS 综合排名</CardTitle>
              <Badge variant="primary" className="ml-2">排名依据：姚币</Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground relative z-10">
                <Filter className="h-4 w-4 shrink-0" />
                <label className="sr-only" htmlFor="dept-filter">部门筛选</label>
                <select
                  id="dept-filter"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="rounded-lg border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer min-w-[120px] appearance-auto"
                >
                  <option value="all">全部部门</option>
                  {departments.length === 0 && <option value="" disabled>暂无部门</option>}
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-1" />导出报表
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">排名</TableHead>
                  <TableHead>BOSS</TableHead>
                  <TableHead>部门</TableHead>
                  <TableHead>姚币</TableHead>
                  <TableHead>末次获得时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {users.length === 0 ? "暂无用户数据，请先注册成员BOSS账号" : "当前部门无数据"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((item, idx) => {
                    const rank = idx + 1
                    return (
                      <TableRow key={item.id} className="animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                        <TableCell>
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                            rank === 1 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                            rank === 2 ? "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400" :
                            rank === 3 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                            "bg-muted text-muted-foreground"
                          }`}>{rank}</div>
                        </TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-sm">{item.department}</TableCell>
                        <TableCell>
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">
                            <Star className="h-3 w-3 mr-1 fill-amber-500" />
                            {item.points}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.lastPointsTime
                            ? new Date(item.lastPointsTime).toLocaleString("zh-CN", {
                                year: "numeric", month: "2-digit", day: "2-digit",
                                hour: "2-digit", minute: "2-digit"
                              })
                            : "未获得"}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
