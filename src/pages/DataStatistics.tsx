import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { BarChart3, TrendingUp, Download, Upload, Trophy, Users } from "lucide-react"

const bossRankings = [
  { rank: 1, name: "赵六", department: "华东事业部", greetings: 12800, replies: 4560, replyRate: "35.6%", roi: "2.8x", score: 95 },
  { rank: 2, name: "吴九", department: "西部事业部", greetings: 9800, replies: 3230, replyRate: "33.0%", roi: "2.5x", score: 88 },
  { rank: 3, name: "孙七", department: "华北事业部", greetings: 15200, replies: 4860, replyRate: "32.0%", roi: "2.3x", score: 85 },
  { rank: 4, name: "郑十", department: "华南事业部", greetings: 6500, replies: 2010, replyRate: "30.9%", roi: "2.1x", score: 78 },
  { rank: 5, name: "陈十一", department: "华东事业部", greetings: 3200, replies: 920, replyRate: "28.8%", roi: "1.8x", score: 70 },
  { rank: 6, name: "周八", department: "华中事业部", greetings: 4500, replies: 1200, replyRate: "26.7%", roi: "1.5x", score: 65 },
]

const departmentStats = [
  { department: "华东事业部", bossCount: 8, totalGreetings: 45000, totalReplies: 15600, avgReplyRate: "34.7%", totalCost: "¥128,000", avgRoi: "2.6x" },
  { department: "华南事业部", bossCount: 6, totalGreetings: 32000, totalReplies: 10200, avgReplyRate: "31.9%", totalCost: "¥96,000", avgRoi: "2.3x" },
  { department: "华北事业部", bossCount: 5, totalGreetings: 28000, totalReplies: 8600, avgReplyRate: "30.7%", totalCost: "¥72,000", avgRoi: "2.1x" },
  { department: "华中事业部", bossCount: 4, totalGreetings: 18000, totalReplies: 5000, avgReplyRate: "27.8%", totalCost: "¥54,000", avgRoi: "1.8x" },
  { department: "西部事业部", bossCount: 3, totalGreetings: 15000, totalReplies: 4800, avgReplyRate: "32.0%", totalCost: "¥35,000", avgRoi: "2.4x" },
]

export default function DataStatistics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight gradient-text">数据统计</h1>
        <p className="text-sm text-muted-foreground mt-1">资源使用统计、BOSS 排名、投入产出比分析</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "总打招呼数", value: "138,000", change: "+12.3%", icon: <TrendingUp className="h-5 w-5" /> },
          { title: "总回复数", value: "44,260", change: "+8.7%", icon: <BarChart3 className="h-5 w-5" /> },
          { title: "平均回复率", value: "32.1%", change: "+2.1%", icon: <TrendingUp className="h-5 w-5" /> },
          { title: "总投入产出比", value: "2.3x", change: "+0.3x", icon: <Trophy className="h-5 w-5" /> },
        ].map((item, i) => (
          <Card key={i}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground">{item.title}</CardTitle>
              <div className="text-primary">{item.icon}</div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-xs text-emerald-500 mt-1">较上月 {item.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="bossRanking">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="bossRanking">BOSS 排名</TabsTrigger>
            <TabsTrigger value="departmentStats">部门统计</TabsTrigger>
            <TabsTrigger value="dataImport">数据导入</TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            导出报表
          </Button>
        </div>

        {/* BOSS Ranking Tab */}
        <TabsContent value="bossRanking" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-base">BOSS 综合排名</CardTitle>
                <Badge variant="primary" className="ml-2">排名依据：回复率 + 投入产出比</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">排名</TableHead>
                    <TableHead>BOSS</TableHead>
                    <TableHead>部门</TableHead>
                    <TableHead>打招呼数</TableHead>
                    <TableHead>回复数</TableHead>
                    <TableHead>回复率</TableHead>
                    <TableHead>投入产出比</TableHead>
                    <TableHead>综合评分</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bossRankings.map((item) => (
                    <TableRow key={item.rank} className="animate-fade-in" style={{ animationDelay: `${item.rank * 50}ms` }}>
                      <TableCell>
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                          item.rank === 1 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                          item.rank === 2 ? "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400" :
                          item.rank === 3 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {item.rank}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-sm">{item.department}</TableCell>
                      <TableCell className="font-mono text-sm">{item.greetings.toLocaleString()}</TableCell>
                      <TableCell className="font-mono text-sm">{item.replies.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={parseFloat(item.replyRate) > 32 ? "success" : "default"}>
                          {item.replyRate}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm font-medium text-emerald-600">{item.roi}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${item.score}%` }} />
                          </div>
                          <span className="text-xs font-medium">{item.score}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Department Stats Tab */}
        <TabsContent value="departmentStats" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">部门数据统计</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>部门</TableHead>
                    <TableHead>BOSS人数</TableHead>
                    <TableHead>总打招呼</TableHead>
                    <TableHead>总回复</TableHead>
                    <TableHead>平均回复率</TableHead>
                    <TableHead>总成本</TableHead>
                    <TableHead>平均投入产出比</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departmentStats.map((item) => (
                    <TableRow key={item.department}>
                      <TableCell className="font-medium">{item.department}</TableCell>
                      <TableCell>{item.bossCount}</TableCell>
                      <TableCell className="font-mono text-sm">{item.totalGreetings.toLocaleString()}</TableCell>
                      <TableCell className="font-mono text-sm">{item.totalReplies.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="success">{item.avgReplyRate}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{item.totalCost}</TableCell>
                      <TableCell className="font-mono text-sm font-medium text-emerald-600">{item.avgRoi}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Import Tab */}
        <TabsContent value="dataImport" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">数据导入与计算</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border-2 border-dashed p-8 text-center">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium">拖拽文件到此处，或点击上传</p>
                  <p className="text-xs text-muted-foreground mt-1">支持 .xlsx, .csv 格式的 BOSS 企业后台导出数据</p>
                  <Button variant="outline" size="sm" className="mt-4">
                    <Upload className="h-4 w-4 mr-1" />
                    选择文件上传
                  </Button>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium">数据导入说明</p>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <li>• 可从 BOSS 企业后台导出数据后上传到本系统</li>
                    <li>• 系统自动计算：回复率 = 回复数 / 打招呼数 × 100%</li>
                    <li>• 投入产出比 = 产出价值 / 资源成本</li>
                    <li>• 如需包含招聘数据，请联系运营部提供司机招聘人数及合格情况</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
