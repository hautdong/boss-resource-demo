import { Card, CardContent, CardHeader } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Input } from "../components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Search, Filter, Shield, ChevronUp, ChevronDown, Download } from "lucide-react"

const users = [
  { id: "U001", name: "张明", role: "超管", department: "总部", status: "已激活", level: "L3", joinDate: "2025-01-15", phone: "138****0001" },
  { id: "U002", name: "李华", role: "管理", department: "华东事业部", status: "已激活", level: "L2", joinDate: "2025-02-20", phone: "138****0002" },
  { id: "U003", name: "王五", role: "管理", department: "华南事业部", status: "待激活", level: "L2", joinDate: "2025-03-10", phone: "138****0003" },
  { id: "U004", name: "赵六", role: "成员", department: "华东事业部", status: "已激活", level: "L1", joinDate: "2025-03-22", phone: "138****0004" },
  { id: "U005", name: "孙七", role: "成员", department: "华北事业部", status: "已激活", level: "L1", joinDate: "2025-04-05", phone: "138****0005" },
  { id: "U006", name: "周八", role: "成员", department: "华中事业部", status: "冻结", level: "L1", joinDate: "2025-04-18", phone: "138****0006" },
  { id: "U007", name: "吴九", role: "成员", department: "西部事业部", status: "已激活", level: "L2", joinDate: "2025-05-01", phone: "138****0007" },
  { id: "U008", name: "郑十", role: "成员", department: "华南事业部", status: "待激活", level: "L1", joinDate: "2025-05-12", phone: "138****0008" },
]

export default function AccountManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight gradient-text">账号管理</h1>
        <p className="text-sm text-muted-foreground mt-1">查看所有用户账号，管理账号激活、权限分级、升降级</p>
      </div>

      <Tabs defaultValue="all">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">全部用户</TabsTrigger>
            <TabsTrigger value="active">已激活</TabsTrigger>
            <TabsTrigger value="pending">待激活</TabsTrigger>
            <TabsTrigger value="frozen">已冻结</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              导出
            </Button>
          </div>
        </div>

        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="搜索用户名、手机号..." className="pl-9" />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-1" />
                  筛选
                </Button>
                <Badge variant="outline" className="ml-auto">共 {users.length} 名用户</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>用户名</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>部门</TableHead>
                    <TableHead>级别</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>注册日期</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user, i) => (
                    <TableRow key={user.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                      <TableCell className="text-muted-foreground">{user.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.role === "超管" ? "primary" :
                            user.role === "管理" ? "secondary" : "outline"
                          }
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{user.department}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">{user.level}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.status === "已激活" ? "success" :
                            user.status === "待激活" ? "warning" : "destructive"
                          }
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.joinDate}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <ChevronUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <ChevronDown className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="outline" size="sm" className="h-8">详情</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active">
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              已激活账号显示区域，操作同上
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="pending">
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              待激活账号 — 需要完成考试才能激活
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="frozen">
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              已冻结账号 — 可在此恢复或处理
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
