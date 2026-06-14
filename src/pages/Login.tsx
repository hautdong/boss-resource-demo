import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Eye, EyeOff, Loader2, Sparkles } from "lucide-react"

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

          {/* ── Quick Login Buttons ── */}
          <div className="mt-8 pt-6 border-t">
            <p className="text-xs text-muted-foreground text-center mb-3">快速登录（点击一键登录）</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setUsername("chaoguan"); setPassword("666666"); setError(""); }}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 px-2.5 py-2 text-xs font-medium text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors"
              >
                🔮 超管
              </button>
              <button
                type="button"
                onClick={() => { setUsername("guanli"); setPassword("666666"); setError(""); }}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-2 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                🔵 管理员
              </button>
              <button
                type="button"
                onClick={() => { setUsername("testboss"); setPassword("123456"); setError(""); }}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
              >
                🎮 教程体验
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">自动填入账号密码，点击「登录」即可</p>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            还没有账号？{" "}
            <Link to="/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
              立即注册
            </Link>
            {"  ·  "}
            <Link to="/forgot-password" className="text-primary hover:text-primary/80 font-medium transition-colors">
              忘记密码
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
