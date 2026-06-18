import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Input } from "../components/ui/input"
import { Select } from "../components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Filter, Download, Bell, Clock } from "lucide-react"

const logs = [
  { id: 1, user: "超级管理员", action: "资源分配", target: "赵六 - 打招呼数 5000条", ip: "192.168.1.100", time: "2025-06-09 14:32:18", type: "operation" },
  { id: 2, user: "李华", action: "资源审批通过", target: "孙七 - 线索包 2000条", ip: "192.168.1.101", time: "2025-06-09 14:12:05", type: "operation" },
  { id: 3, user: "系统", action: "成本预警触发", target: "总预算剩余不足10%", ip: "-", time: "2025-06-09 13:45:00", type: "system" },
  { id: 4, user: "王五", action: "账号激活", target: "考试成绩达标，账号激活", ip: "192.168.1.102", time: "2025-06-09 11:20:33", type: "auth" },
  { id: 5, user: "超级管理员", action: "用户登录", target: "IP: 192.168.1.100", ip: "192.168.1.100", time: "2025-06-09 10:00:00", type: "auth" },
  { id: 6, user: "赵六", action: "资质申请", target: "临时申请 - 打招呼数 3000条", ip: "192.168.1.103", time: "2025-06-09 09:45:22", type: "operation" },
  { id: 7, user: "超级管理员", action: "数据导出", target: "6月BOSS排名报表.xlsx", ip: "192.168.1.100", time: "2025-06-09 09:30:15", type: "operation" },
  { id: 8, user: "李华", action: "成本台账订正", target: "华南事业部线索包费用修正", ip: "192.168.1.101", time: "2025-06-09 09:12:00", type: "operation" },
  { id: 9, user: "系统", action: "自动判卷", target: "郑十 - 考试成绩 85分 (通过)", ip: "-", time: "2025-06-09 08:50:30", type: "system" },
  { id: 10, user: "周八", action: "用户登出", target: "IP: 192.168.1.104", ip: "192.168.1.104", time: "2025-06-08 18:30:00", type: "auth" },
  { id: 11, user: "超级管理员", action: "姚币调整", target: "吴九 姚币增加 5 姚币", ip: "192.168.1.100", time: "2025-06-08 16:20:45", type: "auth" },
  { id: 12, user: "李华", action: "资源回收", target: "赵六 - 过期线索包 800条", ip: "192.168.1.101", time: "2025-06-08 15:00:00", type: "operation" },
]

const typeColors: Record<string, "primary" | "secondary" | "outline"> = {
  operation: "primary",
  auth: "secondary",
  system: "outline",
}

const typeLabels: Record<string, string> = {
  operation: "操作日志",
  auth: "认证日志",
  system: "系统日志",
}

export default function OperationLogs() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight gradient-text">操作日志</h1>
        <p className="text-sm text-muted-foreground mt-1">查看谁在什么时候做了什么事情，系统操作全程留痕</p>
      </div>

      {/* Notifications */}
      <Card className="border-amber-200 dark:border-amber-800">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-base">待办提醒</CardTitle>
            <Badge variant="warning" className="ml-2">3 条未处理</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { msg: "有 2 条资质申请待审批（超过 24 小时未处理）", time: "2 小时前" },
              { msg: "成本预警：总预算剩余 ¥115,000（23%），请合理规划", time: "3 小时前" },
              { msg: "郑十的账号激活考试已完成，请审核", time: "5 小时前" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="mt-1 h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm">{item.msg}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {item.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Log Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <input
                type="text"
                placeholder="搜索操作内容、用户..."
                className="w-full rounded-lg border bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
            <Select
              options={[
                { value: "", label: "全部类型" },
                { value: "operation", label: "操作日志" },
                { value: "auth", label: "认证日志" },
                { value: "system", label: "系统日志" },
              ]}
              className="w-32"
            />
            <Input type="date" className="w-36" defaultValue="2025-06-09" />
            <Button variant="outline" size="sm" className="ml-auto">
              <Download className="h-4 w-4 mr-1" />
              导出日志
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>操作用户</TableHead>
                <TableHead>操作类型</TableHead>
                <TableHead>操作内容</TableHead>
                <TableHead>操作对象</TableHead>
                <TableHead>IP 地址</TableHead>
                <TableHead>操作时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log, i) => (
                <TableRow key={log.id} className="animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                  <TableCell className="text-muted-foreground">{log.id}</TableCell>
                  <TableCell className="font-medium">{log.user}</TableCell>
                  <TableCell>
                    <Badge variant={typeColors[log.type]}>{typeLabels[log.type]}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{log.action}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate" title={log.target}>
                    {log.target}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{log.ip}</TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{log.time}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
