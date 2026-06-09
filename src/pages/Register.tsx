import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Badge } from "../components/ui/badge"
import { Shield, ArrowLeft, Loader2, Check, Info, Phone } from "lucide-react"

export default function Register() {
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!/^[a-zA-Z0-9_]{2,20}$/.test(username)) {
      setError("用户名仅支持字母、数字、下划线，长度 2-20 位")
      return
    }
    if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
      setError("请输入正确的 11 位手机号")
      return
    }
    if (password.length < 6) {
      setError("密码长度至少 6 位")
      return
    }

    setLoading(true)
    try {
      const result = await register({ name, username, phone, password })
      if (result.success) {
        setSuccess(true)
        setTimeout(() => navigate("/activation", { replace: true }), 1500)
      } else {
        setError(result.error || "注册失败")
      }
    } catch {
      setError("系统异常，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center animate-scale-in">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-6">
            <Check className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold gradient-text">注册成功！</h2>
          <p className="text-muted-foreground mt-2">即将进入账号激活流程...</p>
        </div>
      </div>
    )
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

          <div className="space-y-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Info className="h-4 w-4" />
              预设账号（可直接登录）
            </h3>
            {[
              { name: "林伶俐", role: "超级管理员", badge: "超管" as const, color: "bg-violet-500", username: "lll" },
              { name: "林锦超", role: "管理员", badge: "管理" as const, color: "bg-blue-500", username: "ljc" },
              { name: "黄文凤", role: "成员BOSS", badge: "成员" as const, color: "bg-emerald-500", username: "hwf" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className={`h-2 w-2 rounded-full ${item.color}`} />
                <Badge className="bg-white/10 text-white border-0">{item.badge}</Badge>
                <span className="text-white font-medium">{item.name}</span>
                <span className="text-indigo-200 text-xs">{item.role}</span>
                <span className="text-indigo-300 text-xs ml-auto">@{item.username}</span>
              </div>
            ))}
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
            <h2 className="text-2xl font-bold gradient-text">姚司机 · 创建账号</h2>
            <p className="text-muted-foreground mt-2">填写基本信息完成注册</p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive animate-fade-in-down">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">真实姓名</label>
              <Input
                placeholder="请输入您的真实姓名"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">例如：黄文凤</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">登录用户名</label>
              <Input
                placeholder="英文或字母组合，2-20位"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                pattern="[a-zA-Z0-9_]{2,20}"
              />
              <p className="text-xs text-muted-foreground">仅支持字母、数字、下划线，用于登录系统</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">手机号</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="请输入11位手机号"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">选填，用于账号安全验证</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">登录密码</label>
              <Input
                type="password"
                placeholder="至少 6 位密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
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
    </div>
  )
}
