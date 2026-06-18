import { useState, useMemo } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { matchRoleByName, getRoleLabel, getRoleColorClass, getDefaultDepartment } from "../lib/roleConfig"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Select } from "../components/ui/select"
import { Badge } from "../components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog"
import { Shield, ArrowLeft, Loader2, Phone, UserRound, Building2, KeyRound, Eye, EyeOff, GraduationCap } from "lucide-react"

const departmentOptions = [
  { value: "", label: "请选择所在部门" },
  { value: "事业部", label: "事业部" },
  { value: "运营部", label: "运营部" },
  { value: "公关部", label: "公关部" },
  { value: "产品部", label: "产品部" },
  { value: "监管部", label: "监管部" },
  { value: "管培生", label: "管培生" },
  { value: "培训部", label: "培训部" },
  { value: "财务部", label: "财务部" },
  { value: "行政部", label: "行政部" },
  { value: "总经办", label: "总经办" },
  { value: "组织部", label: "组织部" },
]

export default function Register() {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [department, setDepartment] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showRegisterDialog, setShowRegisterDialog] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  // 根据输入姓名实时匹配角色
  const matchedRole = useMemo(() => matchRoleByName(name), [name])
  const roleLabel = useMemo(() => getRoleLabel(matchedRole), [matchedRole])
  const roleColorClass = useMemo(() => getRoleColorClass(matchedRole), [matchedRole])
  const effectiveDepartment = department || getDefaultDepartment(matchedRole)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError("请输入正确的 11 位手机号")
      return
    }
    if (password.length < 6) {
      setError("密码长度至少 6 位")
      return
    }

    setLoading(true)
    try {
      const result = await register({ name, username: phone, phone, password, department })
      if (result.success) {
        setShowRegisterDialog(true)
      } else {
        setError(result.error || "注册失败")
      }
    } catch {
      setError("系统异常，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-[480px] relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 overflow-hidden p-12 flex-col justify-between">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-white/5" />

        <div className="relative z-10">
          <Link to="/login" className="inline-flex items-center gap-2 text-indigo-200 hover:text-white transition-colors mb-12">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">返回登录</span>
          </Link>

          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm overflow-hidden">
              <img src="/logo-yaosiji.png" alt="姚司机" className="h-full w-full object-cover" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">姚司机·注册新账号</h2>
              <p className="text-indigo-200 text-sm">加入姚司机BOSS资源管理系统</p>
            </div>
          </div>

          {/* 角色说明 */}
          <div className="space-y-3">
            <p className="text-white/80 text-sm font-medium">注册说明</p>
            <div className="space-y-2 text-indigo-200 text-sm">
              <p>• 系统根据您的真实姓名自动分配角色</p>
              <p>• 目前所有人注册后统一为 <span className="text-white font-medium">成员BOSS</span></p>
              <p>• 注册后需完成激活考试方可使用系统</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-indigo-200 text-xs">
          <Shield className="h-4 w-4 inline mr-1" />
          注册后需完成激活考试方可使用系统功能
        </div>
      </div>

      {/* Right - Register Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="w-full max-w-md animate-fade-in">
          <Link to="/login" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors lg:hidden mb-6">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">返回登录</span>
          </Link>

          <div className="text-center mb-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl overflow-hidden mb-4 lg:hidden">
              <img src="/logo-yaosiji.png" alt="姚司机" className="h-full w-full object-cover" />
            </div>
            <h2 className="text-2xl font-bold gradient-text">创建账号</h2>
            <p className="text-muted-foreground mt-2">填写基本信息完成注册</p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive animate-fade-in-down">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 所在部门 */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                所在部门 <span className="text-destructive">*</span>
              </label>
              <Select
                options={departmentOptions}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              />
            </div>

            {/* 真实姓名 */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <UserRound className="h-4 w-4 text-muted-foreground" />
                真实姓名 <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="请输入您的真实姓名"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* 角色预览 */}
            {name.trim() && (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3 animate-fade-in-down">
                <p className="text-xs font-medium text-muted-foreground">📋 系统将为您分配</p>
                <div className="flex items-center gap-3">
                  <Badge className={roleColorClass}>{roleLabel}</Badge>
                  <span className="text-sm text-muted-foreground">
                    所属 <span className="font-medium text-foreground">{effectiveDepartment}</span>
                  </span>
                </div>
              </div>
            )}

            {/* 手机号 */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-muted-foreground" />
                手机号 <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="请输入11位手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                required
              />
              <p className="text-xs text-muted-foreground">手机号将作为您的登录账号</p>
            </div>

            {/* 密码 */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                登录密码 <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="至少 6 位密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full h-12 text-base" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  注册中...
                </>
              ) : (
                "注册并登录"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            已有账号？{" "}
            <Link to="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
              立即登录
            </Link>
          </p>
        </div>
      </div>

      {/* 注册成功弹窗 */}
      <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-500 shadow-lg animate-scale-in">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <DialogTitle className="text-center text-xl animate-fade-in">🎉 注册成功</DialogTitle>
            <DialogDescription className="text-center pt-2">
              <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-800 p-4 animate-scale-in">
                <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                  注册成功，现在可以进入新手教程了！
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Button
              variant="primary"
              className="w-full"
              size="lg"
              onClick={() => navigate("/activation", { replace: true })}
            >
              <GraduationCap className="h-4 w-4 mr-1" />去学习
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
