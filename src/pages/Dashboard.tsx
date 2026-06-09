import { Users, Server, Activity, AlertTriangle } from "lucide-react"
import { StatCard } from "../components/StatCard"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight gradient-text">工作台</h1>
        <p className="text-sm text-muted-foreground mt-1">欢迎回来，这里是 BOSS 资源分配系统的管理总览</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="注册用户"
          value="1,284"
          change="较上月 +12.5%"
          trend="up"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="活跃资源"
          value="486"
          change="较上月 +8.2%"
          trend="up"
          icon={<Server className="h-5 w-5" />}
        />
        <StatCard
          title="本月申请"
          value="93"
          change="较上月 -3.1%"
          trend="down"
          icon={<Activity className="h-5 w-5" />}
        />
        <StatCard
          title="成本预警"
          value="2"
          change="50万剩余不足10%"
          trend="down"
          icon={<AlertTriangle className="h-5 w-5" />}
        />
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">快捷操作</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "新增账号", desc: "注册新用户", color: "bg-indigo-500" },
                { label: "资源审批", desc: "待审批 12 条", color: "bg-amber-500" },
                { label: "数据导出", desc: "导出统计报表", color: "bg-emerald-500" },
                { label: "成本台账", desc: "查看成本明细", color: "bg-violet-500" },
              ].map((item, i) => (
                <button
                  key={i}
                  className="group flex flex-col items-start gap-1 rounded-lg border p-4 text-left hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
                >
                  <div className={`h-2 w-8 rounded-full ${item.color} opacity-80`} />
                  <span className="mt-2 text-sm font-semibold">{item.label}</span>
                  <span className="text-xs text-muted-foreground">{item.desc}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">最近动态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: "资源分配", user: "张明", target: "华东区 BOSS 账号", time: "2 分钟前", type: "success" },
                { action: "账号激活", user: "李华", target: "考试成绩达标通过", time: "15 分钟前", type: "success" },
                { action: "成本预警", user: "系统", target: "预算剩余不足 10%", time: "1 小时前", type: "warning" },
                { action: "资源申请", user: "王五", target: "申请额外线索包 5000 条", time: "2 小时前", type: "pending" },
                { action: "账号冻结", user: "赵六", target: "连续 30 天未登录", time: "3 小时前", type: "destructive" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                    item.type === "success" ? "bg-emerald-500" :
                    item.type === "warning" ? "bg-amber-500" :
                    item.type === "destructive" ? "bg-destructive" : "bg-muted-foreground"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{item.user}</span>
                      <span className="text-muted-foreground"> {item.action} </span>
                      <span className="font-medium">{item.target}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resource Usage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">资源使用概览</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: "打招呼数", used: 45800, total: 100000, color: "bg-indigo-500" },
              { name: "回复数", used: 12800, total: 50000, color: "bg-emerald-500" },
              { name: "线索包", used: 35, total: 100, color: "bg-amber-500" },
              { name: "预算额度", used: 385000, total: 500000, color: "bg-violet-500", unit: "元" },
            ].map((item, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-muted-foreground">
                    {item.used?.toLocaleString()}{item.unit || ""} / {item.total?.toLocaleString()}{item.unit || ""}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color} transition-all duration-1000`}
                    style={{ width: `${(item.used / item.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
