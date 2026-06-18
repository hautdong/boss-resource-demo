import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { useAuth } from "../context/AuthContext"
import { api } from "../lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog"
import { Download, Trophy, Users, Star, Upload, FileText, AlertCircle, CheckCircle2, XCircle, Loader2, History } from "lucide-react"
import * as XLSX from "xlsx"

// ─── 奖励标准（硬编码，与用户提供的 Excel 一致）───
const REWARD_STANDARDS = [
  { key: "greeting",    label: "我打招呼（主动发起沟通）",                 unitPoints: 1 },
  { key: "chat",        label: "我沟通（双向有效聊天）",                   unitPoints: 2 },
  { key: "phone",       label: "交换电话/微信（获取线下联系方式）",          unitPoints: 3 },
  { key: "interview",   label: "邀约面试（发送面试邀请）",                   unitPoints: 1 },
  { key: "accept",      label: "接受面试（司机确认面试到场）",               unitPoints: 1 },
  { key: "onsite",      label: "司机到场完成面试",                         unitPoints: 5 },
  { key: "hired",       label: "司机正式入职上岗",                         unitPoints: 10 },
  { key: "settled",     label: "司机结算合格",                             unitPoints: 15 },
]

// 从标准生成列名映射
const STANDARD_NAMES = REWARD_STANDARDS.map(s => s.label)
const STANDARD_KEYS = REWARD_STANDARDS.map(s => s.key)

// ─── 解析上传文件 ───
function parseFile(data: ArrayBuffer): { headers: string[]; rows: any[][] } {
  const wb = XLSX.read(data, { type: "array" })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const json = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 })
  if (json.length < 2) throw new Error("文件数据不足，至少需要表头+1行数据")
  const headers = (json[0] as string[]).map(h => String(h || "").trim())
  const rows = json.slice(1).filter((r: any[]) => r.some(c => c !== undefined && c !== null && String(c).trim() !== ""))
  return { headers, rows }
}

// ─── 解析一行，提取姓名、部门和各指标数量 ───
interface ParsedRow {
  name: string
  department: string
  data: Record<string, number>
  raw: any[]
}

function parseRow(headers: string[], row: any[]): ParsedRow | null {
  const result: ParsedRow = { name: "", department: "", data: {}, raw: row }

  // 自动识别列：寻找姓名/部门/各指标的列
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].toLowerCase()
    const val = row[i]

    if (h.includes("姓名") || h.includes("名字") || h === "name" || h === "boss" || h === "boss姓名") {
      result.name = String(val || "").trim()
    } else if (h.includes("部门") || h === "dept" || h === "department") {
      result.department = String(val || "").trim()
    } else {
      // 匹配奖励标准列
      for (const std of REWARD_STANDARDS) {
        // 检查表头是否包含该标准的关键词
        const headerNorm = h.replace(/[\s（(]/g, "").replace(/[\s）)]/g, "")
        const labelNorm = std.label.replace(/[\s（(]/g, "").replace(/[\s）)]/g, "")
        if (headerNorm.includes(labelNorm) || labelNorm.includes(headerNorm)) {
          const num = parseFloat(String(val || "0").replace(/[^\d.-]/g, ""))
          if (!isNaN(num)) result.data[std.key] = num
          break
        }
      }
    }
  }

  if (!result.name) return null
  return result
}

// ─── 计算姚币 ───
function calcPoints(data: Record<string, number>): number {
  return REWARD_STANDARDS.reduce((sum, std) => sum + (data[std.key] || 0) * std.unitPoints, 0)
}

// ─── 生成原因描述 ───
function buildReason(data: Record<string, number>): string {
  const parts = REWARD_STANDARDS
    .filter(s => (data[s.key] || 0) > 0)
    .map(s => `${s.label.replace(/[（(].*[）)]/, "")} ${data[s.key]}×${s.unitPoints}`)
  return "司机入职激励: " + parts.join(", ")
}

// ─── 批量导入流程状态 ───
interface ImportItem {
  name: string
  department: string
  data: Record<string, number>
  points: number
  matched: boolean
  userId?: string
  reason: string
  error?: string
}

interface ImportHistoryRecord {
  id: string
  fileName: string
  totalAmount: number
  userCount: number
  items: string
  importedBy: string
  importedAt: string
}

// ═══════════════════════════════════════════════
// RankUser interface
// ═══════════════════════════════════════════════
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

// ═══════════════════════════════════════════════
// PointsImport — 姚币导入子组件（仅超管可见）
// ═══════════════════════════════════════════════
function PointsImport() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [parsedItems, setParsedItems] = useState<ImportItem[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [importing, setImporting] = useState(false)
  const [fileName, setFileName] = useState("")
  const [importDone, setImportDone] = useState(false)
  const [importResult, setImportResult] = useState<{ importId: string; totalAmount: number; userCount: number } | null>(null)
  const [history, setHistory] = useState<ImportHistoryRecord[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [parseError, setParseError] = useState("")

  const loadHistory = useCallback(async () => {
    try {
      const data = await api.points.importHistory()
      setHistory(data || [])
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setParseError("")

    try {
      const buf = await file.arrayBuffer()
      const { headers, rows } = parseFile(buf)

      // 解析每行
      const items: ImportItem[] = []
      for (const row of rows) {
        const parsed = parseRow(headers, row)
        if (!parsed) continue
        const pts = calcPoints(parsed.data)
        items.push({
          name: parsed.name,
          department: parsed.department,
          data: parsed.data,
          points: pts,
          matched: false,
          reason: buildReason(parsed.data),
        })
      }

      if (items.length === 0) {
        setParseError("未能从文件中解析出有效数据，请检查表头格式")
        return
      }

      // 匹配 BOSS 用户（按部门+姓名）
      try {
        let users: any[] = []
        try {
          users = await api.admin.users()
        } catch {
          // 降级到 localStorage
          const raw = localStorage.getItem("boss-resource-users")
          if (raw) {
            const all = JSON.parse(raw)
            users = Object.values(all).map((e: any) => e.user || e)
          }
        }

        for (const item of items) {
          const matched = users.find(
            (u: any) => u.name === item.name && u.department === item.department && u.role === "boss"
          )
          if (matched) {
            item.matched = true
            item.userId = matched.id
          } else {
            item.error = `未找到 (${item.department}-${item.name}) 的 BOSS 用户`
          }
        }
      } catch {
        // 匹配失败全部标记为未匹配
      }

      setParsedItems(items)
      setShowPreview(true)
    } catch (err: any) {
      setParseError("解析文件失败: " + (err.message || ""))
    }
  }

  const handleImport = async () => {
    const validItems = parsedItems.filter(i => i.matched && i.points > 0)
    if (validItems.length === 0) {
      alert("没有可导入的有效数据")
      return
    }

    setImporting(true)
    try {
      const payload = validItems.map(i => ({
        userId: i.userId,
        amount: i.points,
        reason: i.reason,
        detail: i.data,
      }))
      const result = await api.points.batchImport(payload, fileName)
      setImportResult(result)
      setImportDone(true)
      setShowPreview(false)
      loadHistory()
    } catch (err: any) {
      alert("导入失败: " + (err.message || ""))
    } finally {
      setImporting(false)
    }
  }

  const reset = () => {
    setParsedItems([])
    setShowPreview(false)
    setFileName("")
    setImportDone(false)
    setImportResult(null)
    setParseError("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const totalPreviewPoints = parsedItems.reduce((s, i) => s + (i.matched ? i.points : 0), 0)

  return (
    <div className="space-y-4">
      {/* 奖励标准展示 */}
      <div className="rounded-xl border bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-900/10 dark:to-orange-900/10 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          <span className="text-sm font-semibold">姚币奖励标准</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {REWARD_STANDARDS.map(s => (
            <div key={s.key} className="rounded-lg bg-white/60 dark:bg-white/5 px-3 py-2 text-xs">
              <span className="text-muted-foreground block truncate" title={s.label}>{s.label}</span>
              <span className="font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">{s.unitPoints} 姚币/人</span>
            </div>
          ))}
        </div>
      </div>

      {/* 上传区域 */}
      <div className="flex items-center gap-3 flex-wrap">
        <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} className="hidden" />
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-4 w-4 mr-1" />选择文件
        </Button>
        {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
        <Button variant="ghost" size="sm" onClick={loadHistory}>
          <History className="h-4 w-4 mr-1" />导入记录
        </Button>
      </div>

      {/* 错误提示 */}
      {parseError && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{parseError}
        </div>
      )}

      {/* 预览弹窗 */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>导入预览</DialogTitle>
            <DialogDescription>
              共解析 {parsedItems.length} 条数据，匹配成功 {parsedItems.filter(i => i.matched).length} 条，预计总加 <strong className="text-amber-600">{totalPreviewPoints}</strong> 姚币
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>部门</TableHead>
                  {REWARD_STANDARDS.map(s => (
                    <TableHead key={s.key} className="text-right text-[10px]">{s.label.slice(0, 6)}</TableHead>
                  ))}
                  <TableHead className="text-right">姚币</TableHead>
                  <TableHead>状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedItems.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-sm">{item.department}</TableCell>
                    {REWARD_STANDARDS.map(s => (
                      <TableCell key={s.key} className="text-right text-sm">{item.data[s.key] || 0}</TableCell>
                    ))}
                    <TableCell className="text-right font-bold text-amber-600">{item.points}</TableCell>
                    <TableCell>
                      {item.matched ? (
                        <Badge variant="success" className="text-[10px]">已匹配</Badge>
                      ) : (
                        <span className="text-[10px] text-destructive" title={item.error}>{item.error || "未匹配"}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowPreview(false)}>取消</Button>
            <Button onClick={handleImport} disabled={importing || parsedItems.filter(i => i.matched).length === 0}>
              {importing ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />导入中...</> : "确认添加姚币"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 导入成功弹窗 */}
      <Dialog open={importDone} onOpenChange={setImportDone}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-3">
              <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <DialogTitle className="text-center">导入成功</DialogTitle>
            <DialogDescription className="text-center pt-2">
              {importResult && (
                <div className="space-y-1">
                  <p>成功为 <strong className="text-foreground">{importResult.userCount}</strong> 位成员添加姚币</p>
                  <p className="text-lg font-bold text-amber-600">共 +{importResult.totalAmount} 姚币</p>
                  <p className="text-xs text-muted-foreground mt-1">导入编号: {importResult.importId}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <Button variant="primary" className="w-full" onClick={reset}>
            完成
          </Button>
        </DialogContent>
      </Dialog>

      {/* 导入历史弹窗 */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="sm:max-w-xl max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>导入记录</DialogTitle>
            <DialogDescription>历史批量导入姚币记录</DialogDescription>
          </DialogHeader>
          {history.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">暂无导入记录</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>文件</TableHead>
                    <TableHead className="text-right">人数</TableHead>
                    <TableHead className="text-right">姚币</TableHead>
                    <TableHead>导入人</TableHead>
                    <TableHead>时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map(h => (
                    <TableRow key={h.id}>
                      <TableCell className="text-sm max-w-[120px] truncate" title={h.fileName}>{h.fileName}</TableCell>
                      <TableCell className="text-right">{h.userCount}</TableCell>
                      <TableCell className="text-right font-bold text-amber-600">+{h.totalAmount}</TableCell>
                      <TableCell className="text-sm">{h.importedBy}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {h.importedAt ? new Date(h.importedAt + "Z").toLocaleString("zh-CN") : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ═══════════════════════════════════════════════
// DataStatistics — 主页面
// ═══════════════════════════════════════════════
export default function DataStatistics() {
  const { user } = useAuth()
  const [users, setUsers] = useState<RankUser[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const isAdmin = user?.role === "super_admin" || user?.role === "admin"

  // 加载数据 — 优先 API，降级 localStorage
  const loadData = useCallback(async () => {
    setPageLoading(true)
    try {
      const data = await api.points.ranking()
      setUsers(data || [])
    } catch {
      // 降级到 localStorage
      try {
        const raw = localStorage.getItem("boss-resource-users")
        if (!raw) { setUsers([]); return }
        const allUsers = JSON.parse(raw)
        const entries = Object.entries(allUsers) as [string, any][]
        const mapped: RankUser[] = entries
          .map(([, entry]) => {
            const u = entry.user || entry
            if (u.role !== "boss") return null
            const userKey = `${u.name || ""}-${u.phone || u.username || ""}`
            const points = (() => { try { return Number(localStorage.getItem(`boss-points-${userKey}`)) || 0 } catch { return 0 } })()
            const lastPointsTime = (() => { try { return localStorage.getItem(`boss-points-last-time-${userKey}`) || "" } catch { return "" } })()
            return { id: u.id, name: u.name || "", username: u.username || "", phone: u.phone || "", department: u.department || "未分配", roleLabel: u.roleLabel || "成员BOSS", points, lastPointsTime }
          })
          .filter(Boolean) as RankUser[]
        setUsers(mapped)
      } catch { setUsers([]) }
    } finally { setPageLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // 刷新（导入成功后调用）
  const handleRefresh = () => {
    loadData()
  }

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (a.lastPointsTime && b.lastPointsTime) {
        return new Date(a.lastPointsTime).getTime() - new Date(b.lastPointsTime).getTime()
      }
      if (a.lastPointsTime) return -1
      if (b.lastPointsTime) return 1
      return 0
    })
  }, [users])

  const departments = useMemo(() => {
    const deps = new Set(users.map(u => u.department).filter(Boolean))
    return Array.from(deps).sort()
  }, [users])

  const [departmentFilter, setDepartmentFilter] = useState("all")

  const filteredUsers = useMemo(() => {
    if (departmentFilter === "all") return sortedUsers
    return sortedUsers.filter(u => u.department === departmentFilter)
  }, [sortedUsers, departmentFilter])

  const totalBoss = sortedUsers.length
  const totalPoints = sortedUsers.reduce((s, u) => s + u.points, 0)
  const avgPoints = totalBoss > 0 ? (totalPoints / totalBoss).toFixed(1) : "0"

  const handleExport = () => {
    const rows = [["排名", "姓名", "部门", "姚币", "末次获得时间"]]
    filteredUsers.forEach((u, i) => {
      const timeStr = u.lastPointsTime ? new Date(u.lastPointsTime).toLocaleString("zh-CN") : "未获得"
      rows.push([String(i + 1), u.name, u.department, String(u.points), timeStr])
    })
    const csv = rows.map(r => r.join(",")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = "BOSS姚币排名.csv"; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight gradient-text">数据统计</h1>
          <p className="text-sm text-muted-foreground mt-1">BOSS 姚币排名</p>
        </div>
      </div>

      {/* 统计摘要卡片 */}
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

      {/* 超管：姚币导入区域 */}
      {isAdmin && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">姚币奖励导入</CardTitle>
              <Badge variant="primary" className="text-[10px]">超管</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <PointsImport />
          </CardContent>
        </Card>
      )}

      {/* 综合排名 */}
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
                <label className="sr-only" htmlFor="dept-filter">部门筛选</label>
                <select
                  id="dept-filter"
                  value={departmentFilter}
                  onChange={e => setDepartmentFilter(e.target.value)}
                  className="rounded-lg border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer min-w-[120px] appearance-auto"
                >
                  <option value="all">全部部门</option>
                  {departments.length === 0 && <option value="" disabled>暂无部门</option>}
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-1" />导出报表
              </Button>
              {isAdmin && (
                <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={pageLoading}>
                  <Loader2 className={`h-4 w-4 mr-1 ${pageLoading ? "animate-spin" : ""}`} />
                  刷新
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
                {pageLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : filteredUsers.length === 0 ? (
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
