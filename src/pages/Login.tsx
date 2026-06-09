import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Eye, EyeOff, Loader2, Sparkles, User } from "lucide-react"

const quickUsers = [
  { label: "林伶俐", role: "超级管理员", badge: "超管", username: "lll", password: "admin123", color: "bg-violet-500" },
  { label: "林锦超", role: "管理员", badge: "管理", username: "ljc", password: "admin123", color: "bg-blue-500" },
  { label: "黄文凤", role: "成员BOSS", badge: "成员", username: "hwf", password: "13141314", color: "bg-emerald-500" },
]

export default function Login() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await login(username, password)
      if (result.success) {
        navigate("/", { replace: true })
      } else {
        setError(result.error || "登录失败")
      }
    } catch {
      setError("系统异常，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = async (u: string, p: string) => {
    setUsername(u)
    setPassword(p)
    setError("")
    setLoading(true)
    try {
      const result = await login(u, p)
      if (result.success) {
        navigate("/", { replace: true })
      } else {
        setError(result.error || "登录失败")
      }
    } catch {
      setError("系统异常")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left - Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute top-1/3 -left-10 w-40 h-40 rounded-full bg-white/5" />

        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-xl overflow-hidden">
              <img src="/logo-yaosiji.png" alt="姚司机" className="h-full w-full object-cover" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">姚司机·BOSS资源管理</h1>
              <p className="text-indigo-200 text-sm">资源分配管理系统</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold text-white leading-tight mb-6">
            高效管理
            <br />
            <span className="text-indigo-200">BOSS资源分配</span>
          </h2>

          <p className="text-indigo-200 text-lg mb-12 leading-relaxed">
            资源申请 · 智能审批 · 成本管控 · 数据洞察
            <br />
            全流程数字化管理，让资源分配更高效
          </p>

          <div className="space-y-4">
            {[
              { title: "角色自动分配", desc: "系统根据姓名自动分配超管/管理员/成员权限" },
              { title: "账号激活体系", desc: "学习资料 + 在线考试，成绩达标自动激活" },
              { title: "数据驱动决策", desc: "BOSS 排名、投入产出比分析，资源分配有据可依" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-indigo-300 shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium">{item.title}</p>
                  <p className="text-indigo-200 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile Logo */}
          <div className="flex flex-col items-center lg:hidden mb-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20 mb-4 overflow-hidden">
              <img src="/logo-yaosiji.png" alt="姚司机" className="h-full w-full object-cover" />
            </div>
            <h1 className="text-xl font-bold">姚司机·BOSS资源管理</h1>
            <p className="text-sm text-muted-foreground">资源分配管理系统</p>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold gradient-text">欢迎回来</h2>
            <p className="text-muted-foreground mt-2">输入用户名和密码登录系统</p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive animate-fade-in-down">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">用户名</label>
              <Input
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">密码</label>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
                  登录中...
                </>
              ) : (
                "登录"
              )}
            </Button>
          </form>

          {/* Quick Login */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">快速体验</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {quickUsers.map((u) => (
              <button
                key={u.username}
                onClick={() => quickLogin(u.username, u.password)}
                className="flex flex-col items-center gap-1.5 rounded-lg border p-3 hover:bg-accent hover:shadow-md transition-all duration-200 group"
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${u.color.replace('bg-', 'bg-').replace('-500', '-100 dark:')} dark:text-${u.color.replace('bg-', '')}`}>
                  <User className="h-4 w-4" style={{ color: u.color.replace('bg-', '#') }} />
                </div>
                <span className="text-xs font-medium">{u.label}</span>
                <span className="text-[10px] text-muted-foreground">{u.badge} · @{u.username}</span>
              </button>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            还没有账号？{" "}
            <Link to="/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
