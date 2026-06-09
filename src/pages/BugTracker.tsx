import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Input } from "../components/ui/input"
import { Select } from "../components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "../components/ui/dialog"
import { Plus, BugPlay, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { useState } from "react"

const initialBugs = [
  { id: "BUG-001", title: "账号激活考试页面在移动端显示异常", reporter: "赵六", severity: "中等", status: "待修复", date: "2025-06-08", module: "账号管理" },
  { id: "BUG-002", title: "成本台账导出 Excel 格式错乱", reporter: "李华", severity: "严重", status: "修复中", date: "2025-06-07", module: "资源管理" },
  { id: "BUG-003", title: "资源申请数量输入负数未校验", reporter: "王五", severity: "轻微", status: "已修复", date: "2025-06-06", module: "资源管理" },
  { id: "BUG-004", title: "操作日志时间显示与服务器时间不一致", reporter: "超级管理员", severity: "中等", status: "已关闭", date: "2025-06-05", module: "日志管理" },
  { id: "BUG-005", title: "深色模式下部分文字对比度不足", reporter: "超级管理员", severity: "轻微", status: "待修复", date: "2025-06-04", module: "UI" },
  { id: "BUG-006", title: "资源分配后通知未及时推送", reporter: "张明", severity: "严重", status: "修复中", date: "2025-06-03", module: "通知" },
]

const severityColors: Record<string, "destructive" | "warning" | "outline"> = {
  "严重": "destructive",
  "中等": "warning",
  "轻微": "outline",
}

const statusColors: Record<string, "destructive" | "warning" | "success" | "secondary"> = {
  "待修复": "destructive",
  "修复中": "warning",
  "已修复": "success",
  "已关闭": "secondary",
}

export default function BugTracker() {
  const [bugs, setBugs] = useState(initialBugs)
  const [newBug, setNewBug] = useState({ title: "", severity: "中等", module: "", reporter: "" })
  const [open, setOpen] = useState(false)

  const handleSubmit = () => {
    if (!newBug.title.trim()) return
    const bug = {
      id: `BUG-${String(bugs.length + 1).padStart(3, "0")}`,
      title: newBug.title,
      reporter: newBug.reporter || "匿名用户",
      severity: newBug.severity,
      status: "待修复" as const,
      date: new Date().toISOString().split("T")[0],
      module: newBug.module || "其他",
    }
    setBugs([bug, ...bugs])
    setNewBug({ title: "", severity: "中等", module: "", reporter: "" })
    setOpen(false)
  }

  const stats = {
    total: bugs.length,
    pending: bugs.filter((b) => b.status === "待修复").length,
    fixing: bugs.filter((b) => b.status === "修复中").length,
    fixed: bugs.filter((b) => b.status === "已修复" || b.status === "已关闭").length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight gradient-text">Bug 记录与修复</h1>
        <p className="text-sm text-muted-foreground mt-1">记录使用中遇到的问题，跟踪修复进度</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">总记录</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">待修复</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">修复中</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-500">{stats.fixing}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">已完成</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-500">{stats.fixed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Bug List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BugPlay className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Bug 记录列表</CardTitle>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger>
                <Button variant="primary" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  上报 Bug
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>上报 Bug</DialogTitle>
                  <DialogDescription>
                    请描述您在使用过程中遇到的问题，管理员将根据记录进行修复
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">问题描述</label>
                    <textarea
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="请详细描述您遇到的问题..."
                      value={newBug.title}
                      onChange={(e) => setNewBug((prev) => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">严重程度</label>
                      <Select
                        options={[
                          { value: "严重", label: "严重" },
                          { value: "中等", label: "中等" },
                          { value: "轻微", label: "轻微" },
                        ]}
                        value={newBug.severity}
                        onChange={(e) => setNewBug((prev) => ({ ...prev, severity: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">相关模块</label>
                      <Select
                        options={[
                          { value: "", label: "请选择" },
                          { value: "账号管理", label: "账号管理" },
                          { value: "资源管理", label: "资源管理" },
                          { value: "数据统计", label: "数据统计" },
                          { value: "日志管理", label: "日志管理" },
                          { value: "UI", label: "UI" },
                          { value: "通知", label: "通知" },
                          { value: "其他", label: "其他" },
                        ]}
                        value={newBug.module}
                        onChange={(e) => setNewBug((prev) => ({ ...prev, module: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">上报人</label>
                    <Input
                      placeholder="请输入姓名（选填）"
                      value={newBug.reporter}
                      onChange={(e) => setNewBug((prev) => ({ ...prev, reporter: e.target.value }))}
                    />
                  </div>
                  <Button variant="primary" className="w-full" onClick={handleSubmit}>
                    提交 Bug 记录
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">编号</TableHead>
                <TableHead>问题描述</TableHead>
                <TableHead>上报人</TableHead>
                <TableHead>严重程度</TableHead>
                <TableHead>相关模块</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>上报日期</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bugs.map((bug, i) => (
                <TableRow key={bug.id} className="animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{bug.id}</TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">{bug.title}</span>
                  </TableCell>
                  <TableCell className="text-sm">{bug.reporter}</TableCell>
                  <TableCell>
                    <Badge variant={severityColors[bug.severity]}>{bug.severity}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{bug.module}</TableCell>
                  <TableCell>
                    <Badge variant={statusColors[bug.status]}>
                      {bug.status === "待修复" && <AlertCircle className="h-3 w-3 mr-1 inline" />}
                      {bug.status === "修复中" && <Clock className="h-3 w-3 mr-1 inline" />}
                      {bug.status === "已修复" && <CheckCircle2 className="h-3 w-3 mr-1 inline" />}
                      {bug.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{bug.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
