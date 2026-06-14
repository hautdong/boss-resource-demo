import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { ArrowLeft, Phone, KeyRound, ShieldCheck, Check, Send, Loader2, Eye, EyeOff } from "lucide-react"

type Step = "phone" | "code" | "reset" | "done"

export default function ForgotPassword() {
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState<Step>("phone")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [devCode, setDevCode] = useState("")
  const { sendVerificationCode, verifyCode, resetPassword } = useAuth()
  const navigate = useNavigate()

  // 验证码倒计时
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const handleSendCode = async () => {
    setError("")
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError("请输入正确的 11 位手机号")
      return
    }
    setLoading(true)
    try {
      const result = sendVerificationCode(phone)
      if (result.success) {
        setDevCode(result.code || "")
        setCountdown(60)
        setStep("code")
      } else {
        setError(result.error || "发送失败")
      }
    } catch {
      setError("系统异常，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    setError("")
    if (code.length !== 6) {
      setError("请输入 6 位验证码")
      return
    }
    setLoading(true)
    try {
      const result = verifyCode(phone, code)
      if (result.success) {
        setStep("reset")
      } else {
        setError(result.error || "验证码错误")
      }
    } catch {
      setError("系统异常，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    setError("")
    if (newPassword.length < 6) {
      setError("密码长度至少 6 位")
      return
    }
    setLoading(true)
    try {
      const result = resetPassword(phone, newPassword)
      if (result.success) {
        setStep("done")
        setTimeout(() => navigate("/login", { replace: true }), 2000)
      } else {
        setError(result.error || "重置失败")
      }
    } catch {
      setError("系统异常，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  const phoneMasked = phone.length === 11
    ? phone.slice(0, 3) + "****" + phone.slice(7)
    : phone

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md animate-fade-in">
        <Link to="/login" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">返回登录</span>
        </Link>

        {step === "done" ? (
          <div className="text-center animate-scale-in">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-6">
              <Check className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold gradient-text">密码重置成功！</h2>
            <p className="text-muted-foreground mt-2">即将返回登录页...</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold gradient-text">找回密码</h2>
              <p className="text-muted-foreground mt-2">
                {step === "phone" && "请输入注册时使用的手机号"}
                {step === "code" && `验证码已发送至 ${phoneMasked}`}
                {step === "reset" && "请设置新的登录密码"}
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive animate-fade-in-down">
                {error}
              </div>
            )}

            {/* Step 1: 输入手机号 */}
            {step === "phone" && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    手机号
                  </label>
                  <Input
                    placeholder="请输入11位手机号"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                    required
                  />
                </div>
                <Button variant="primary" className="w-full h-12" onClick={handleSendCode} disabled={loading}>
                  {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  获取验证码
                </Button>
              </div>
            )}

            {/* Step 2: 输入验证码 */}
            {step === "code" && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    短信验证码
                  </label>
                  <Input
                    placeholder="请输入 6 位验证码"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    className="text-center text-lg tracking-[0.5em]"
                    maxLength={6}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    验证码已发送至 <span className="font-medium text-foreground">{phoneMasked}</span>
                  </p>
                  {devCode && (
                    <div className="text-center mt-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2">
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        🔔 开发测试用验证码：<span className="font-bold text-base tracking-wider">{devCode}</span>
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <Button variant="primary" className="w-full h-12" onClick={handleVerifyCode} disabled={loading || code.length !== 6}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                    验证
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={handleSendCode}
                    disabled={countdown > 0 || loading}
                  >
                    {countdown > 0 ? `重新发送 (${countdown}s)` : "重新发送验证码"}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: 设置新密码 */}
            {step === "reset" && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <KeyRound className="h-4 w-4 text-muted-foreground" />
                    新密码
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="至少 6 位新密码"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
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
                <Button variant="primary" className="w-full h-12" onClick={handleReset} disabled={loading || newPassword.length < 6}>
                  {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                  重置密码
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
