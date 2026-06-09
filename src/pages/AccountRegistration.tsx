import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Select } from "../components/ui/select"
import { Badge } from "../components/ui/badge"
import { UserPlus, CheckCircle, Upload, BookOpen } from "lucide-react"

const roleOptions = [
  { value: "", label: "请选择职位" },
  { value: "super_admin", label: "超级管理员 - 系统管理员" },
  { value: "admin", label: "管理员 - 区域负责人" },
  { value: "boss", label: "成员BOSS - 业务负责人" },
]

const departmentOptions = [
  { value: "", label: "请选择部门" },
  { value: "east", label: "华东事业部" },
  { value: "south", label: "华南事业部" },
  { value: "north", label: "华北事业部" },
  { value: "central", label: "华中事业部" },
  { value: "west", label: "西部事业部" },
]

export default function AccountRegistration() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    department: "",
    position: "",
    role: "",
  })

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert(`账号注册申请已提交！\n根据职位自动分配角色: ${roleOptions.find(r => r.value === formData.role)?.label}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight gradient-text">账号注册</h1>
        <p className="text-sm text-muted-foreground mt-1">新用户注册账号，系统根据姓名和职位自动分配角色</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              注册信息填写
            </CardTitle>
            <CardDescription>
              填写基本信息后提交，系统将自动根据您的职位分配角色权限
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">姓名</label>
                <Input
                  placeholder="请输入真实姓名"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">手机号</label>
                <Input
                  placeholder="请输入手机号"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">邮箱</label>
                <Input
                  type="email"
                  placeholder="请输入邮箱地址"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">所属部门</label>
                  <Select
                    options={departmentOptions}
                    value={formData.department}
                    onChange={(e) => handleChange("department", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">职位</label>
                  <Select
                    options={[
                      { value: "", label: "请选择职位" },
                      { value: "director", label: "总监" },
                      { value: "manager", label: "经理" },
                      { value: "supervisor", label: "主管" },
                      { value: "staff", label: "专员" },
                    ]}
                    value={formData.position}
                    onChange={(e) => handleChange("position", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">系统推荐角色</label>
                <Select
                  options={roleOptions}
                  value={formData.role}
                  onChange={(e) => handleChange("role", e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  * 根据填写信息系统自动推荐，管理员可手动调整
                </p>
              </div>
              <Button type="submit" variant="primary" className="w-full">
                提交注册申请
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info Panel */}
        <div className="space-y-6">
          {/* Role Assignment Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">角色说明</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    role: "超级管理员",
                    badge: "超管" as const,
                    desc: "拥有系统最高权限，可进行所有管理操作",
                    color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
                  },
                  {
                    role: "管理员",
                    badge: "管理" as const,
                    desc: "负责区域资源审批、分配、成本台账管理",
                    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                  },
                  {
                    role: "成员BOSS",
                    badge: "成员" as const,
                    desc: "资源申请、查看已分配资源、异议反馈",
                    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Badge className={item.color}>{item.badge}</Badge>
                    <div>
                      <p className="text-sm font-medium">{item.role}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Activation Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                账号激活流程
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                    1
                  </div>
                  <div>
                    <p className="text-sm font-medium">下载学习资料</p>
                    <p className="text-xs text-muted-foreground">管理员上传的学习文档和视频</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      <Upload className="h-3.5 w-3.5 mr-1" />
                      下载资料
                    </Button>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                    2
                  </div>
                  <div>
                    <p className="text-sm font-medium">在线考试</p>
                    <p className="text-xs text-muted-foreground">完成学习后进行在线考试</p>
                    <Button variant="ghost" size="sm" className="mt-2">
                      <BookOpen className="h-3.5 w-3.5 mr-1" />
                      开始考试
                    </Button>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-bold shrink-0">
                    3
                  </div>
                  <div>
                    <p className="text-sm font-medium">成绩达标 → 激活成功</p>
                    <p className="text-xs text-muted-foreground">自动判卷，成绩合格后账号自动激活</p>
                    <Badge variant="success" className="mt-2">自动判卷</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
