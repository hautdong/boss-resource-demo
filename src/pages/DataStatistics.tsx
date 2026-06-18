import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { useAuth } from "../context/AuthContext"
import { api } from "../lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog"
import { Download, Trophy, Users, Star, Upload, FileText, AlertCircle, CheckCircle2, XCircle, Loader2, History } from "lucide-react"

// ─── 奖励标准 ───
const REWARD_STANDARDS = [
  { key: "greeting",    label: "我打招呼",           unitPoints: 1 },
  { key: "chat",        label: "我沟通",             unitPoints: 2 },
  { key: "phone",       label: "交换电话/微信",        unitPoints: 3 },
  { key: "interview",   label: "邀约面试",            unitPoints: 1 },
  { key: "accept",      label: "接受面试",            unitPoints: 1 },
  { key: "onsite",      label: "司机到场面试",         unitPoints: 5 },
  { key: "hired",       label: "司机正式入职",         unitPoints: 10 },
  { key: "settled",     label: "司机结算合格",         unitPoints: 15 },
]

const STANDARD_KEYS = REWARD_STANDARDS.map(s => s.key)

// ─── 类型 ───
interface RankUser {
  id: string; name: string; username: string; phone: string
  department: string; roleLabel: string; points: number; lastPointsTime: string
}

interface ImportItem {
  name: string; department: string
  data: Record<string, number>; points: number
  matched: boolean; userId?: string; reason: string; error?: string
}

interface ImportHistoryRecord {
  id: string; fileName: string; totalAmount: number
  userCount: number; items: string; importedBy: string; importedAt: string
}

// ─── 工具函数 ───
async function parseExcel(buf: ArrayBuffer): Promise<{ headers: string[]; rows: any[][] }> {
  const XLSX = await import("xlsx")
  const wb = XLSX.read(buf, { type: "array" })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const json = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 })
  if (json.length < 2) throw new Error("文件数据不足")
  const headers = (json[0] as string[]).map(h => String(h || "").trim())
  const rows = json.slice(1).filter((r: any[]) => r.some(c => c != null && String(c).trim() !== ""))
  return { headers, rows }
}

function parseRow(headers: string[], row: any[]): ImportItem | null {
  const item: ImportItem = { name: "", department: "", data: {}, points: 0, matched: false, reason: "" }
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].toLowerCase()
    const val = row[i]
    if (h.includes("姓名") || h === "name") { item.name = String(val || "").trim(); continue }
    if (h.includes("部门") || h === "dept") { item.department = String(val || "").trim(); continue }
    for (const std of REWARD_STANDARDS) {
      const hn = h.replace(/[\s（(]/g,"").replace(/[\s）)]/g,"")
      const ln = std.label.replace(/[\s]/g,"")
      if (hn.includes(ln) || ln.includes(hn)) {
        const num = parseFloat(String(val || "0").replace(/[^\d.-]/g, ""))
        if (!isNaN(num)) item.data[std.key] = num
        break
      }
    }
  }
  if (!item.name) return null
  const calc = REWARD_STANDARDS.reduce((s, st) => s + (item.data[st.key] || 0) * st.unitPoints, 0)
  item.points = calc
  const parts = REWARD_STANDARDS.filter(st => (item.data[st.key] || 0) > 0).map(st => `${st.label} ${item.data[st.key]||0}×${st.unitPoints}`)
  item.reason = "司机入职激励: " + parts.join(", ")
  return item
}

// ═══════════════════════════════════════════════
// PointsImport
// ═══════════════════════════════════════════════
function PointsImport({ onImported }: { onImported: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState<ImportItem[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [importing, setImporting] = useState(false)
  const [fileName, setFileName] = useState("")
  const [done, setDone] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [history, setHistory] = useState<ImportHistoryRecord[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [err, setErr] = useState("")

  const loadHistory = useCallback(async () => {
    try { setHistory((await api.points.importHistory()) || []) } catch {}
  }, [])
  useEffect(() => { loadHistory() }, [loadHistory])

  const downloadTemplate = async () => {
    const XLSX = await import("xlsx")
    const headers = ["BOSS姓名", "部门", ...REWARD_STANDARDS.map(s => s.label)]
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([headers])
    // 列宽
    ws["!cols"] = [
      { wch: 12 }, { wch: 10 },
      ...REWARD_STANDARDS.map(() => ({ wch: 14 }))
    ]
    XLSX.utils.book_append_sheet(wb, ws, "姚币导入模板")
    XLSX.writeFile(wb, "姚币导入模板.xlsx")
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name); setErr("")
    try {
      const buf = await file.arrayBuffer()
      const { headers, rows } = await parseExcel(buf)
      const parsed: ImportItem[] = []
      for (const row of rows) {
        const p = parseRow(headers, row)
        if (p) parsed.push(p)
      }
      if (parsed.length === 0) { setErr("未能解析出有效数据"); return }
      // 匹配用户
      let users: any[] = []
      try { users = await api.admin.users() } catch {
        const raw = localStorage.getItem("boss-resource-users")
        if (raw) users = Object.values(JSON.parse(raw)).map((e: any) => e.user || e)
      }
      for (const p of parsed) {
        const m = users.find((u: any) => u.name === p.name && u.department === p.department && u.role === "boss")
        if (m) { p.matched = true; p.userId = m.id }
        else p.error = `未匹配 ${p.department}-${p.name}`
      }
      setItems(parsed); setShowPreview(true)
    } catch (ex: any) { setErr("解析失败: " + (ex.message || "")) }
  }

  const doImport = async () => {
    const valid = items.filter(i => i.matched && i.points > 0)
    if (valid.length === 0) { alert("无有效数据"); return }
    setImporting(true)
    try {
      const payload = valid.map(i => ({ userId: i.userId, amount: i.points, reason: i.reason, detail: i.data }))
      const r = await api.points.batchImport(payload, fileName)
      setResult(r); setDone(true); setShowPreview(false); loadHistory(); onImported()
    } catch (ex: any) { alert("导入失败: " + (ex.message || "")) }
    finally { setImporting(false) }
  }

  const totalPts = items.reduce((s, i) => s + (i.matched ? i.points : 0), 0)

  return (
    <div className="space-y-4">
      {/* 标准展示 */}
      <div className="rounded-xl border bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-900/10 dark:to-orange-900/10 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          <span className="text-sm font-semibold">姚币奖励标准</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {REWARD_STANDARDS.map(s => (
            <div key={s.key} className="rounded-lg bg-white/60 dark:bg-white/5 px-3 py-2 text-xs">
              <span className="text-muted-foreground block">{s.label}</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">{s.unitPoints} 姚币/人</span>
            </div>
          ))}
        </div>
      </div>
      {/* 上传 */}
      <div className="flex gap-2 flex-wrap">
        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} className="hidden" />
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4 mr-1" />选择文件</Button>
        <Button variant="outline" size="sm" onClick={downloadTemplate}><Download className="h-4 w-4 mr-1" />下载模板</Button>
        {fileName && <span className="text-sm text-muted-foreground self-center">{fileName}</span>}
        <Button variant="ghost" size="sm" onClick={() => setShowHistory(true)}><History className="h-4 w-4 mr-1" />导入记录</Button>
      </div>
      {err && <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{err}</div>}

      {/* 预览 */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>导入预览</DialogTitle>
            <DialogDescription>共 {items.length} 条，匹配 {items.filter(i=>i.matched).length} 条，预计加 <strong className="text-amber-600">{totalPts}</strong> 姚币</DialogDescription>
          </DialogHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>姓名</TableHead><TableHead>部门</TableHead>
                {REWARD_STANDARDS.map(s => <TableHead key={s.key} className="text-right text-[10px]">{s.label.slice(0,6)}</TableHead>)}
                <TableHead className="text-right">姚币</TableHead><TableHead>状态</TableHead>
              </TableRow></TableHeader>
              <TableBody>{items.map((i, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{i.name}</TableCell>
                  <TableCell className="text-sm">{i.department}</TableCell>
                  {REWARD_STANDARDS.map(s => <TableCell key={s.key} className="text-right text-sm">{i.data[s.key] || 0}</TableCell>)}
                  <TableCell className="text-right font-bold text-amber-600">{i.points}</TableCell>
                  <TableCell>{i.matched ? <Badge variant="success" className="text-[10px]">已匹配</Badge> : <span className="text-[10px] text-destructive">{i.error}</span>}</TableCell>
                </TableRow>))}</TableBody>
            </Table>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowPreview(false)}>取消</Button>
            <Button onClick={doImport} disabled={importing || items.filter(i=>i.matched).length===0}>
              {importing ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />导入中...</> : "确认添加姚币"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 成功 */}
      <Dialog open={done} onOpenChange={setDone}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-3"><CheckCircle2 className="h-7 w-7 text-emerald-600" /></div>
            <DialogTitle className="text-center">导入成功</DialogTitle>
            <DialogDescription className="text-center pt-2">
              {result && <><p>为 <strong>{result.userCount}</strong> 位成员添加姚币</p><p className="text-lg font-bold text-amber-600">共 +{result.totalAmount} 姚币</p></>}
            </DialogDescription>
          </DialogHeader>
          <Button variant="primary" className="w-full" onClick={() => { setDone(false); setItems([]); setFileName("") }}>完成</Button>
        </DialogContent>
      </Dialog>

      {/* 历史 */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="sm:max-w-xl max-h-[70vh] overflow-y-auto">
          <DialogHeader><DialogTitle>导入记录</DialogTitle></DialogHeader>
          {history.length === 0 ? <div className="text-center py-8 text-sm text-muted-foreground">暂无记录</div> : (
            <Table><TableHeader><TableRow><TableHead>文件</TableHead><TableHead className="text-right">人数</TableHead><TableHead className="text-right">姚币</TableHead><TableHead>导入人</TableHead><TableHead>时间</TableHead></TableRow></TableHeader>
            <TableBody>{history.map(h => (
              <TableRow key={h.id}>
                <TableCell className="text-sm max-w-[120px] truncate" title={h.fileName}>{h.fileName}</TableCell>
                <TableCell className="text-right">{h.userCount}</TableCell>
                <TableCell className="text-right font-bold text-amber-600">+{h.totalAmount}</TableCell>
                <TableCell className="text-sm">{h.importedBy}</TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{h.importedAt ? new Date(h.importedAt+"Z").toLocaleString("zh-CN"):"-"}</TableCell>
              </TableRow>))}</TableBody></Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ═══════════════════════════════════════════════
// DataStatistics
// ═══════════════════════════════════════════════
export default function DataStatistics() {
  const { user } = useAuth()
  const isAdmin = user?.role === "super_admin" || user?.role === "admin"
  const [users, setUsers] = useState<RankUser[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.points.ranking()
      setUsers(data || [])
    } catch {
      try {
        const raw = localStorage.getItem("boss-resource-users")
        if (!raw) { setUsers([]); return }
        const all = JSON.parse(raw)
        const list: RankUser[] = Object.values(all).map((e: any) => {
          const u = e.user || e
          if (u.role !== "boss") return null
          const key = `${u.name||""}-${u.phone||u.username||""}`
          const pts = (() => { try { return Number(localStorage.getItem(`boss-points-${key}`))||0 } catch { return 0 } })()
          const ts = (() => { try { return localStorage.getItem(`boss-points-last-time-${key}`)||"" } catch { return "" } })()
          return { id: u.id, name: u.name||"", username: u.username||"", phone: u.phone||"", department: u.department||"未分配", roleLabel: u.roleLabel||"成员BOSS", points: pts, lastPointsTime: ts }
        }).filter(Boolean) as RankUser[]
        setUsers(list)
      } catch { setUsers([]) }
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const sorted = useMemo(() => [...users].sort((a, b) => b.points - a.points || 0), [users])
  const depts = useMemo(() => [...new Set(users.map(u => u.department).filter(Boolean))].sort(), [users])
  const [deptFilter, setDeptFilter] = useState("all")
  const filtered = useMemo(() => deptFilter === "all" ? sorted : sorted.filter(u => u.department === deptFilter), [sorted, deptFilter])
  const totalBoss = sorted.length
  const totalPts = sorted.reduce((s, u) => s + u.points, 0)
  const avgPts = totalBoss > 0 ? (totalPts / totalBoss).toFixed(1) : "0"

  const handleExport = () => {
    const rows = [["排名","姓名","部门","姚币","末次获得时间"]]
    filtered.forEach((u, i) => {
      rows.push([String(i+1), u.name, u.department, String(u.points), u.lastPointsTime ? new Date(u.lastPointsTime).toLocaleString("zh-CN") : "未获得"])
    })
    const csv = rows.map(r => r.join(",")).join("\n")
    const blob = new Blob(["\uFEFF"+csv], {type:"text/csv;charset=utf-8"})
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = "BOSS姚币排名.csv"; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight gradient-text">数据统计</h1><p className="text-sm text-muted-foreground mt-1">BOSS 姚币排名</p></div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm text-muted-foreground">BOSS 总人数</CardTitle><Users className="h-5 w-5 text-primary" /></CardHeader><CardContent><p className="text-2xl font-bold">{totalBoss}</p></CardContent></Card>
        <Card><CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm text-muted-foreground">总姚币</CardTitle><Star className="h-5 w-5 text-amber-500 fill-amber-500" /></CardHeader><CardContent><p className="text-2xl font-bold">{totalPts}</p></CardContent></Card>
        <Card><CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm text-muted-foreground">平均姚币</CardTitle><Trophy className="h-5 w-5 text-amber-500" /></CardHeader><CardContent><p className="text-2xl font-bold">{avgPts}</p></CardContent></Card>
      </div>

      {isAdmin && (
        <Card><CardHeader className="pb-3"><div className="flex items-center gap-2"><Upload className="h-5 w-5 text-primary" /><CardTitle className="text-base">姚币奖励导入</CardTitle><Badge variant="primary" className="text-[10px]">超管</Badge></div></CardHeader><CardContent><PointsImport onImported={loadData} /></CardContent></Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2"><Trophy className="h-5 w-5 text-amber-500" /><CardTitle className="text-base">BOSS 综合排名</CardTitle><Badge variant="primary" className="ml-2">排名依据：姚币</Badge></div>
            <div className="flex items-center gap-2">
              <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="rounded-lg border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer min-w-[120px] appearance-auto">
                <option value="all">全部部门</option>
                {depts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-1" />导出报表</Button>
              <Button variant="ghost" size="sm" onClick={loadData} disabled={loading}><Loader2 className={`h-4 w-4 mr-1 ${loading?"animate-spin":""}`} />刷新</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead className="w-12">排名</TableHead><TableHead>BOSS</TableHead><TableHead>部门</TableHead><TableHead>姚币</TableHead><TableHead>末次获得时间</TableHead></TableRow></TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{users.length === 0 ? "暂无用户数据" : "当前部门无数据"}</TableCell></TableRow>
                ) : filtered.map((item, idx) => {
                  const rank = idx + 1
                  return (
                    <TableRow key={item.id} className="animate-fade-in" style={{animationDelay:`${idx*50}ms`}}>
                      <TableCell><div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${rank===1?"bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400":rank===2?"bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400":rank===3?"bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400":"bg-muted text-muted-foreground"}`}>{rank}</div></TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-sm">{item.department}</TableCell>
                      <TableCell><Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0"><Star className="h-3 w-3 mr-1 fill-amber-500" />{item.points}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.lastPointsTime ? new Date(item.lastPointsTime).toLocaleString("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}) : "未获得"}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
