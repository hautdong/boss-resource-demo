import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Input } from "../components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { AlertTriangle, CheckCircle, XCircle, Search, ExternalLink, Shield, FileText } from "lucide-react"

const pendingApprovals = [
  { id: "R001", applicant: "赵六", department: "华东事业部", resource: "打招呼数", amount: "5000条", cost: "¥2,500", applyType: "定期", date: "2025-06-07", status: "待审批" },
  { id: "R002", applicant: "孙七", department: "华北事业部", resource: "线索包", amount: "2000条", cost: "¥8,000", applyType: "临时", date: "2025-06-08", status: "待审批" },
  { id: "R003", applicant: "吴九", department: "西部事业部", resource: "回复数", amount: "10000条", cost: "¥5,000", applyType: "定期", date: "2025-06-08", status: "待审批" },
  { id: "R004", applicant: "周八", department: "华中事业部", resource: "打招呼数", amount: "3000条", cost: "¥1,500", applyType: "临时", date: "2025-06-09", status: "待审批" },
]

const allocatedResources = [
  { id: "A001", boss: "赵六", department: "华东事业部", resource: "打招呼数", amount: "15000/20000", used: "75%", cost: "¥10,000", expiry: "2025-07-15" },
  { id: "A002", boss: "孙七", department: "华北事业部", resource: "线索包", amount: "800/5000", used: "16%", cost: "¥20,000", expiry: "2025-08-01" },
  { id: "A003", boss: "吴九", department: "西部事业部", resource: "回复数", amount: "3200/10000", used: "32%", cost: "¥5,000", expiry: "2025-07-20" },
  { id: "A004", boss: "郑十", department: "华南事业部", resource: "打招呼数", amount: "5000/15000", used: "33.3%", cost: "¥7,500", expiry: "2025-08-10" },
  { id: "A005", boss: "陈十一", department: "华东事业部", resource: "线索包", amount: "200/3000", used: "6.7%", cost: "¥12,000", expiry: "2025-07-25" },
]

const costAccounts = [
  { category: "打招呼资源", budget: "¥200,000", used: "¥145,000", remaining: "¥55,000", usage: "72.5%" },
  { category: "线索包资源", budget: "¥150,000", used: "¥120,000", remaining: "¥30,000", usage: "80%" },
  { category: "回复数资源", budget: "¥100,000", used: "¥65,000", remaining: "¥35,000", usage: "65%" },
  { category: "其他资源", budget: "¥50,000", used: "¥55,000", remaining: "-¥5,000", usage: "110%" },
]

export default function ResourceManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight gradient-text">BOSS 资源管理</h1>
        <p className="text-sm text-muted-foreground mt-1">资源申请审批、分配回收、成本台账、预警管理</p>
      </div>

      {/* Cost Warning Banner */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4 flex items-center gap-3 animate-fade-in">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">成本预警</p>
          <p className="text-xs text-amber-700 dark:text-amber-400">总预算 ¥500,000 已使用 ¥385,000，剩余仅 ¥115,000（23%），其中"其他资源"已超支</p>
        </div>
        <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-400">
          查看明细
        </Button>
      </div>

      <Tabs defaultValue="approval">
        <TabsList>
          <TabsTrigger value="approval">资源审批</TabsTrigger>
          <TabsTrigger value="allocated">已分配资源</TabsTrigger>
          <TabsTrigger value="cost">成本台账</TabsTrigger>
          <TabsTrigger value="apply">资源申请</TabsTrigger>
        </TabsList>

        {/* Approval Tab */}
        <TabsContent value="approval" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">待审批申请</CardTitle>
                <Badge variant="warning">{pendingApprovals.length} 条待处理</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>申请人</TableHead>
                    <TableHead>部门</TableHead>
                    <TableHead>资源类型</TableHead>
                    <TableHead>数量</TableHead>
                    <TableHead>成本</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>申请日期</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingApprovals.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.applicant}</TableCell>
                      <TableCell className="text-sm">{item.department}</TableCell>
                      <TableCell>{item.resource}</TableCell>
                      <TableCell>{item.amount}</TableCell>
                      <TableCell className="font-mono text-sm">{item.cost}</TableCell>
                      <TableCell>
                        <Badge variant={item.applyType === "定期" ? "primary" : "outline"}>
                          {item.applyType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.date}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            通过
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                            <XCircle className="h-4 w-4 mr-1" />
                            驳回
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Allocated Resources Tab */}
        <TabsContent value="allocated" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base flex-1">已分配资源</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="搜索BOSS..." className="pl-9 h-9 w-60" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>BOSS</TableHead>
                    <TableHead>部门</TableHead>
                    <TableHead>资源</TableHead>
                    <TableHead>使用量</TableHead>
                    <TableHead>使用率</TableHead>
                    <TableHead>成本</TableHead>
                    <TableHead>到期日</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allocatedResources.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.boss}</TableCell>
                      <TableCell className="text-sm">{item.department}</TableCell>
                      <TableCell>{item.resource}</TableCell>
                      <TableCell className="font-mono text-sm">{item.amount}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                parseFloat(item.used) > 80 ? "bg-destructive" :
                                parseFloat(item.used) > 50 ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                              style={{ width: item.used }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{item.used}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{item.cost}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.expiry}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-8">回收</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cost Accounts Tab */}
        <TabsContent value="cost" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">总预算</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">¥500,000</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">已使用</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-amber-600">¥385,000</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">剩余</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-emerald-600">¥115,000</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">成本台账明细</CardTitle>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-1" />
                  导出台账
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>费用类别</TableHead>
                    <TableHead>预算金额</TableHead>
                    <TableHead>已使用</TableHead>
                    <TableHead>剩余</TableHead>
                    <TableHead>使用率</TableHead>
                    <TableHead className="text-right">状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costAccounts.map((item) => (
                    <TableRow key={item.category}>
                      <TableCell className="font-medium">{item.category}</TableCell>
                      <TableCell className="font-mono text-sm">{item.budget}</TableCell>
                      <TableCell className="font-mono text-sm">{item.used}</TableCell>
                      <TableCell className="font-mono text-sm">{item.remaining}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                parseFloat(item.usage) > 100 ? "bg-destructive" :
                                parseFloat(item.usage) > 80 ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                              style={{ width: `${Math.min(parseFloat(item.usage), 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{item.usage}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {parseFloat(item.usage) > 100 ? (
                          <Badge variant="destructive">超支</Badge>
                        ) : parseFloat(item.usage) > 80 ? (
                          <Badge variant="warning">预警</Badge>
                        ) : (
                          <Badge variant="success">正常</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Apply Resources Tab */}
        <TabsContent value="apply" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">资源申请（成员BOSS视角）</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    定期申请
                  </h3>
                  <div className="rounded-lg border p-4 space-y-3">
                    <div className="space-y-2">
                      <label className="text-xs font-medium">资源类型</label>
                      <select className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                        <option>打招呼数</option>
                        <option>回复数</option>
                        <option>线索包</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">申请数量</label>
                      <Input placeholder="请输入数量" type="number" />
                    </div>
                    <Button variant="primary" className="w-full">提交定期申请</Button>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    临时申请
                  </h3>
                  <div className="rounded-lg border p-4 space-y-3">
                    <div className="space-y-2">
                      <label className="text-xs font-medium">资源类型</label>
                      <select className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                        <option>打招呼数</option>
                        <option>回复数</option>
                        <option>线索包</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">申请数量</label>
                      <Input placeholder="请输入数量" type="number" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">申请理由</label>
                      <textarea
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none"
                        rows={3}
                        placeholder="请说明临时申请的原因..."
                      />
                    </div>
                    <Button variant="secondary" className="w-full">提交临时申请</Button>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-sm">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">需要链接到 BOSS 企业管理后台？</span>
                  <Button variant="outline" size="sm" className="ml-auto">配置连接</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
