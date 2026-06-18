import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useTutorial } from "../context/TutorialContext"
import { authApi } from "../lib/api"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog"
import {
  BookOpen, GraduationCap, CheckCircle2, XCircle,
  AlertCircle, Clock, Trophy, Loader2,
  ChevronLeft, ChevronRight, ChevronDown, Send,
  LogOut
} from "lucide-react"
import questions from "../data/examQuestions"
import ForcedReader from "../components/ForcedReader"

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"]
const EXAM_QUESTION_COUNT = 20
const PASS_SCORE = 80
const EXAM_TIME = 1200 // 20 minutes
const RETRY_COOLDOWN = 3600000 // 1 hour in ms
type Phase = "study" | "exam" | "result"

export default function Activation() {
  const navigate = useNavigate()
  const { user, completeExam, logout } = useAuth()
  const tutorial = useTutorial()
  const userKey = `${user?.name || "unknown"}-${user?.phone || user?.username || "unknown"}`

  // ── Phase control ──
  const [phase, setPhase] = useState<Phase>("study")

  // ── Learning state ──
  const [studyCompleted, setStudyCompleted] = useState(false)

  // 学习阶段 → 如果还在学习页但 step 还没到学习（如 step===0），推进到学习
  // 不改动 step > 0 的情况，避免拦截跳过等主动操作
  useEffect(() => {
    if (phase === "study" && tutorial.state.step === 0) {
      tutorial.goTo("study")
    }
  }, [phase, tutorial.state.step, tutorial.goTo])
  const [adminSkip, setAdminSkip] = useState(() => {
    try { return localStorage.getItem(`boss-admin-skip-${userKey}`) === "true" } catch { return false }
  })

  // 持久化 adminSkip 到 localStorage（按用户隔离）
  useEffect(() => {
    localStorage.setItem(`boss-admin-skip-${userKey}`, String(adminSkip))
    if (adminSkip) setStudyCompleted(true)
  }, [adminSkip, userKey])

  // 当 userKey 就绪后，重新从 localStorage 读取当前用户的 adminSkip
  useEffect(() => {
    const stored = localStorage.getItem(`boss-admin-skip-${userKey}`) === "true"
    if (stored !== adminSkip) setAdminSkip(stored)
  }, [userKey])

  // ── Exam state ──
  const [examAttempt, setExamAttempt] = useState(1)
  const cooldownStorageKey = `boss-last-failed-time-${userKey}`
  const [, setLastFailedTime] = useState(() => {
    try {
      return Number(localStorage.getItem(cooldownStorageKey)) || 0
    } catch { return 0 }
  })
  const computeCooldown = (failedTime: number) => {
    if (!failedTime) return 0
    const remaining = Math.ceil((RETRY_COOLDOWN - (Date.now() - failedTime)) / 1000)
    return Math.max(0, remaining)
  }
  const [cooldownLeft, setCooldownLeft] = useState(() => computeCooldown(
    (() => { try { return Number(localStorage.getItem(cooldownStorageKey)) || 0 } catch { return 0 } })()
  ))
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string[]>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(EXAM_TIME)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [showReview, setShowReview] = useState(true)

  // ── Select 20 random questions from the pool, re-shuffle per attempt ──
  const examQuestions = useMemo(() => {
    const shuffled = [...questions]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled.slice(0, EXAM_QUESTION_COUNT)
  }, [examAttempt])

  const currentQ = examQuestions[currentIndex]
  const selectedAnswer = currentQ ? (answers[currentQ.id] || []) : []
  const answeredCount = Object.keys(answers).length
  const currentAnswered = currentQ ? (answers[currentQ.id]?.length || 0) > 0 : false
  const allAnswered = answeredCount === EXAM_QUESTION_COUNT

  // ── Timer ──
  useEffect(() => {
    if (phase === "exam" && !submitted && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            return 0
          }
          return t - 1
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [phase, submitted, timeLeft])

  // Auto-submit when time runs out
  useEffect(() => {
    if (phase === "exam" && timeLeft === 0 && !submitted) {
      handleSubmitExam()
    }
  }, [timeLeft])

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownLeft <= 0) {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current)
      return
    }
    cooldownTimerRef.current = setInterval(() => {
      setCooldownLeft((t) => {
        if (t <= 1) {
          if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current)
    }
  }, [cooldownLeft])

  // 学习阶段禁止保存/打印/右键
  useEffect(() => {
    if (phase !== "study") return
    const prevent = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase()
        // 禁止 Ctrl+P(打印), Ctrl+S(保存), Ctrl+U(查看源码), Ctrl+Shift+I(开发者工具)
        if (key === "p" || key === "s" || key === "u" || (e.shiftKey && key === "i")) {
          e.preventDefault()
          e.stopPropagation()
        }
      }
      // 禁止 F12
      if (e.key === "F12") {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    const preventCtx = (e: MouseEvent) => e.preventDefault()
    window.addEventListener("keydown", prevent, true)
    document.addEventListener("contextmenu", preventCtx)
    return () => {
      window.removeEventListener("keydown", prevent, true)
      document.removeEventListener("contextmenu", preventCtx)
    }
  }, [phase])

  // ── Handlers ──
  const resetExam = useCallback(() => {
    setExamAttempt((prev) => prev + 1)
    setCurrentIndex(0)
    setAnswers({})
    setSubmitted(false)
    setScore(0)
    setTimeLeft(EXAM_TIME)
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  const startExam = () => {
    resetExam()
    tutorial.goTo("exam")
    setPhase("exam")
  }

  const handleSingleSelect = (label: string) => {
    if (submitted) return
    setAnswers((prev) => ({ ...prev, [currentQ.id]: [label] }))
  }

  const handleMultiSelect = (label: string) => {
    if (submitted) return
    setAnswers((prev) => {
      const cur = prev[currentQ.id] || []
      if (cur.includes(label)) {
        return { ...prev, [currentQ.id]: cur.filter((a) => a !== label) }
      }
      return { ...prev, [currentQ.id]: [...cur, label] }
    })
  }

  const [showPassDialog, setShowPassDialog] = useState(false)

  const handleSubmitExam = async () => {
    let totalScore = 0
    for (const q of examQuestions) {
      const ua = answers[q.id]
      if (!ua || ua.length === 0) continue
      const isCorrect = ua.length === q.answer.length && ua.every((a) => q.answer.includes(a))
      if (isCorrect) totalScore += q.score
    }
    setScore(totalScore)
    setSubmitted(true)
    const passed = totalScore >= PASS_SCORE
    if (!passed) {
      const now = Date.now()
      setLastFailedTime(now)
      localStorage.setItem(cooldownStorageKey, String(now))
      setCooldownLeft(Math.floor(RETRY_COOLDOWN / 1000))
      await completeExam(totalScore, false)
      setSubmitted(false)
      setPhase("result")
    } else {
      // 考试通过：只弹通过弹窗，不显示成绩结果页
      try {
        await authApi.updateActivation({ status: "activated", examScore: totalScore, examPassed: true })
      } catch {}
      tutorial.goTo("apply")
      setSubmitted(false)
      setShowPassDialog(true)
    }
  }

  const handleSkipExam = async () => {
    setScore(100)
    setSubmitted(true)
    tutorial.goTo("apply")
    try {
      await authApi.updateActivation({ status: "activated", examScore: 100, examPassed: true })
    } catch {}
    setSubmitted(false)
    setShowPassDialog(true)
  }

  // 确认通过 → 整页跳转到资质申请页（绕过路由守卫）
  // 跳转后页面刷新，AuthContext 从服务器获取已激活的用户信息
  const confirmActivation = () => {
    if (!confirmActivationCalled.current) {
      confirmActivationCalled.current = true
      window.location.href = "/resource-apply"
    }
  }

  const confirmActivationCalled = useRef(false)

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`

  const correctCount = submitted
    ? examQuestions.filter((q) => {
        const ua = answers[q.id]
        if (!ua) return false
        return ua.length === q.answer.length && ua.every((a) => q.answer.includes(a))
      }).length
    : 0

  // ═══════════════════════════════════════════
  // RESULT PHASE
  // ═══════════════════════════════════════════
  if (phase === "result") {
    const passed = score >= PASS_SCORE
    const pct = Math.round((score / 100) * 100)
    const wrongQuestions = examQuestions.filter((q) => {
      const ua = answers[q.id]
      if (!ua || ua.length === 0) return true
      return !(ua.length === q.answer.length && ua.every((a) => q.answer.includes(a)))
    })

    return (
      <>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-6 px-4">
        <div className="max-w-2xl mx-auto animate-scale-in">
          {/* ── Score Card ── */}
          <div className={`rounded-2xl border p-6 sm:p-8 text-center mb-6 ${
            passed ? "border-emerald-200 dark:border-emerald-800" : "border-destructive/20"
          }`}>
            <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full mb-4 ${
              passed ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-destructive/10"
            }`}>
              {passed
                ? <Trophy className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                : <XCircle className="h-10 w-10 text-destructive" />}
            </div>

            <h2 className={`text-xl sm:text-2xl font-bold mb-1 ${passed ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
              {passed ? "✅ 账号激活成功！" : "❌ 账号激活失败"}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {passed
                ? `你的账号已成功激活（${score}分），可以进入系统使用了`
                : `得分 ${score}/100，未达到通过线 ${PASS_SCORE} 分，账号激活失败`}
            </p>
            {!passed && (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 mb-4 max-w-sm mx-auto text-sm text-left">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-700 dark:text-amber-300">⚠️ 重要提示</p>
                    <p className="text-amber-600 dark:text-amber-400 text-sm mt-1">
                      若第一次考试不通过，后续考试都需要间隔 <strong>1 小时</strong> 才能再次参加。请认真学习、仔细作答！
                    </p>
                    {cooldownLeft > 0 && (
                      <p className="text-amber-600 dark:text-amber-400 text-sm mt-1 font-mono">
                        还需等待: {Math.floor(cooldownLeft / 60)} 分 {cooldownLeft % 60} 秒
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Score display */}
            <div className="mb-4">
              <div className="flex justify-center items-baseline gap-2 mb-2">
                <span className="text-4xl sm:text-5xl font-bold gradient-text">{score}</span>
                <span className="text-base sm:text-lg text-muted-foreground">/ 100</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden max-w-sm mx-auto relative">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${passed ? "bg-emerald-500" : "bg-destructive"}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
                {/* Pass threshold marker */}
                <div
                  className="absolute top-0 h-full w-0.5 bg-amber-400/80"
                  style={{ left: `${PASS_SCORE}%` }}
                  title={`通过线 ${PASS_SCORE} 分`}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">正确率 {pct}%</p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3 mb-4 max-w-xs mx-auto">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xl sm:text-2xl font-bold text-emerald-600">{correctCount}</p>
                <p className="text-xs text-muted-foreground">正确</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xl sm:text-2xl font-bold text-destructive">{EXAM_QUESTION_COUNT - correctCount}</p>
                <p className="text-xs text-muted-foreground">错误</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xl sm:text-2xl font-bold text-primary">{EXAM_QUESTION_COUNT}</p>
                <p className="text-xs text-muted-foreground">总题数</p>
              </div>
            </div>

            {/* Actions */}
            {passed ? (
              <div className="space-y-2 max-w-sm mx-auto">
                <Button variant="primary" className="w-full" onClick={confirmActivation}>
                  <CheckCircle2 className="h-5 w-5 mr-2" />申请BOSS资质
                </Button>
                <Button variant="outline" className="w-full" onClick={() => { logout(); navigate("/login", { replace: true }) }}>
                  <LogOut className="h-4 w-4 mr-2" />返回登录
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-w-sm mx-auto">
                <Button
                  variant="primary"
                  className="w-full"
                  disabled={cooldownLeft > 0}
                  onClick={() => {
                    setPhase("study")
                    setStudyCompleted(false)
                    resetExam()
                  }}
                >
                  {cooldownLeft > 0 ? (
                    <><Clock className="h-5 w-5 mr-2 animate-pulse" />
                    还需等待 {Math.floor(cooldownLeft / 60)}:{(cooldownLeft % 60).toString().padStart(2, "0")}
                    </>
                  ) : (
                    <><BookOpen className="h-5 w-5 mr-2" />重新学习</>
                  )}
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => { logout(); navigate("/login", { replace: true }) }}>
                  <LogOut className="h-4 w-4 mr-2" />返回登录
                </Button>
              </div>
            )}
          </div>

          {/* ── Wrong Questions Review ── */}
          {wrongQuestions.length > 0 && (
            <div className="rounded-2xl border bg-card overflow-hidden">
              <button
                onClick={() => passed && setShowReview(!showReview)}
                className={`w-full flex items-center justify-between p-4 sm:p-5 transition-colors ${
                  passed ? "hover:bg-accent/50 cursor-pointer" : "cursor-default"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
                    <XCircle className="h-4 w-4 text-destructive" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-sm">
                      {passed ? "错题回顾" : "错题解析（请认真复习以下题目）"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {wrongQuestions.length} 题答错{passed ? "，点击查看正确答案" : "，以下是正确答案和解析"}
                    </p>
                  </div>
                </div>
                {passed && (
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                    showReview ? "rotate-180" : ""
                  }`} />
                )}
              </button>

              {showReview && (
                <div className="border-t divide-y">
                  {wrongQuestions.map((q, idx) => {
                    const userAns = answers[q.id] || []
                    const userAnsStr = userAns.length > 0 ? userAns.join("、") : "未作答"
                    const correctAnsStr = q.answer.join("、")
                    return (
                      <div key={q.id} className="p-4 sm:p-5 space-y-3">
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-bold text-muted-foreground mt-0.5 shrink-0 w-5">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant={
                                  q.type === "单选" ? "success" :
                                  q.type === "多选" ? "warning" : "outline"
                                }
                                className="text-[10px]"
                              >
                                {q.type}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">{q.score} 分</span>
                            </div>
                            <p className="text-sm leading-relaxed">{q.title}</p>
                          </div>
                        </div>

                        {/* User's answer */}
                        <div className="flex items-start gap-3 pl-7">
                          <div className="flex h-5 w-5 items-center justify-center rounded bg-destructive/10 shrink-0 mt-0.5">
                            <XCircle className="h-3 w-3 text-destructive" />
                          </div>
                          <div>
                            <p className="text-xs text-destructive font-medium">你的答案</p>
                            <p className="text-sm text-destructive/80">{userAnsStr}</p>
                          </div>
                        </div>

                        {/* Correct answer */}
                        <div className="flex items-start gap-3 pl-7">
                          <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-100 dark:bg-emerald-900/30 shrink-0 mt-0.5">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">正确答案</p>
                            <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">{correctAnsStr}</p>
                          </div>
                        </div>

                        {/* Explanation */}
                        {q.explanation && (
                          <div className="flex items-start gap-3 pl-7">
                            <div className="flex h-5 w-5 shrink-0 mt-0.5" />
                            <p className="text-xs text-muted-foreground italic">{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── All passed, perfect score ── */}
          {wrongQuestions.length === 0 && passed && (
            <div className="rounded-2xl border bg-card p-5 text-center">
              <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">全部答对！</span>
              </div>
              <p className="text-xs text-muted-foreground">太棒了，继续保持！</p>
            </div>
          )}
        </div>
      </div>

      {/* 考试通过弹窗 */}
      <Dialog open={showPassDialog} onOpenChange={setShowPassDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-500 shadow-lg animate-scale-in">
              <Trophy className="h-7 w-7 text-white" />
            </div>
            <DialogTitle className="text-center text-xl animate-fade-in">🎉 恭喜您成功激活账号！</DialogTitle>
            <DialogDescription className="text-center pt-2">
              <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-800 p-4 animate-scale-in">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 animate-pulse" />
                  <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">账号已成功激活！</span>
                </div>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  考试成绩 <strong>{score} 分</strong>，已达到通过线 {PASS_SCORE} 分，现在可以申请BOSS资质了！
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Button
              variant="primary"
              className="w-full"
              size="lg"
              onClick={confirmActivation}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />去申请BOSS资质
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
    )
  }

  // ═══════════════════════════════════════════
  // STUDY PHASE - Forced Reader with timing enforcement
  // ═══════════════════════════════════════════
  if (phase === "study") {
    return (
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        <header className="shrink-0 border-b bg-background/95 backdrop-blur-xl z-20">
          <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 sm:py-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg overflow-hidden shrink-0">
                <img src="/logo-yaosiji.png" alt="姚司机" className="h-full w-full object-cover" />
              </div>
              <span className="font-semibold text-xs sm:text-sm truncate">
                学习资料
              </span>
              <Badge variant="outline" className="text-[10px] sm:text-xs hidden sm:inline-flex">
                {user?.name} ({user?.roleLabel})
              </Badge>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={() => setAdminSkip((prev) => {
                  if (!prev) {
                    setCooldownLeft(0)
                    setLastFailedTime(0)
                    localStorage.removeItem(cooldownStorageKey)
                  }
                  return !prev
                })}
                className={`flex items-center gap-1 text-[10px] sm:text-xs px-2 sm:px-2.5 py-1 rounded-full border transition-colors ${
                  adminSkip
                    ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700"
                    : "text-muted-foreground hover:text-foreground border-transparent hover:border-border"
                }`}
                title={adminSkip ? "关闭跳过模式" : "开启跳过模式"}
              >
                ⚡ <span className="sm:inline">{adminSkip ? "跳过中" : "跳过"}</span>
              </button>
              <button
                onClick={() => { logout(); navigate("/login", { replace: true }) }}
                className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground hover:text-foreground transition-colors"
                title="退出并返回登录"
              >
                <LogOut className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden xs:inline sm:inline">退出</span>
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden" id="study-content-wrapper">
          {/* ━━ LEFT: Forced Reader ━━ */}
          <div className="flex-1 lg:flex-[2] overflow-y-auto p-3 sm:p-4 lg:p-6">
            <ForcedReader
              adminSkip={adminSkip}
              userId={userKey}
              onAllComplete={() => setStudyCompleted(true)}
            />
          </div>

          {/* ━━ RIGHT: Exam Prep ━━ */}
          <div className="flex-1 flex flex-col overflow-hidden lg:border-l bg-muted/20">
            <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
              <div className="w-full max-w-md text-center">
                <div className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-primary/10 mb-4 sm:mb-6">
                  <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>

                <h2 className="text-base sm:text-xl font-bold mb-1 sm:mb-2">
                  {studyCompleted ? "✅ 学习完成" : "📖 正在学习中"}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                  {studyCompleted
                    ? "你已完成所有学习资料，可以开始考试了。"
                    : "请按顺序完成所有资料的阅读，完成后即可解锁考试。"}
                </p>

                {/* 考试规则提示 */}
                <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 sm:p-4 mb-3 sm:mb-4 text-left">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-amber-700 dark:text-amber-300 mb-0.5 sm:mb-1">⚠️ 考试须知</p>
                      <p className="text-[11px] sm:text-sm text-amber-600 dark:text-amber-400">
                        若考试不通过，再次考试需间隔 <strong>1 小时</strong>，且题目会刷新，请认真学习资料，仔细作答！
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-muted/50 p-3 sm:p-4 mb-4 sm:mb-6 text-[11px] sm:text-sm space-y-1.5 sm:space-y-2 text-left">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground shrink-0">题目数量</span>
                    <span className="font-semibold text-right">{EXAM_QUESTION_COUNT} 题（随机抽选）</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground shrink-0">题型</span>
                    <span className="font-semibold text-right">单选 + 多选 + 判断</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground shrink-0">总分</span>
                    <span className="font-semibold text-right">100 分</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground shrink-0">通过线</span>
                    <span className="font-semibold text-emerald-600 text-right">80 分</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground shrink-0">考试模式</span>
                    <span className="font-semibold text-amber-600 text-right">⏱ 闭卷 · 限时 20 分钟</span>
                  </div>
                </div>

                {!studyCompleted && (
                  <div className="flex items-center gap-2 justify-center text-amber-600 dark:text-amber-400 text-xs sm:text-sm mb-3 sm:mb-4">
                    <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    请先完成所有资料的学习
                  </div>
                )}

                <Button
                  id="start-exam-btn"
                  variant="primary"
                  size="lg"
                  className="w-full text-xs sm:text-sm"
                  disabled={!studyCompleted || cooldownLeft > 0}
                  onClick={startExam}
                >
                  {cooldownLeft > 0 ? (
                    <><Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 animate-pulse" />
                    还需等待 {Math.floor(cooldownLeft / 60)}:{(cooldownLeft % 60).toString().padStart(2, "0")}</>
                  ) : studyCompleted ? (
                    <><GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />开始考试</>
                  ) : (
                    <><BookOpen className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />请先完成资料学习</>
                  )}
                </Button>

                {cooldownLeft > 0 && (
                  <div className="flex items-start gap-2 mt-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-2.5 sm:p-3 text-left">
                    <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] sm:text-sm text-amber-700 dark:text-amber-300">
                      上次考试未通过，需等待 1 小时后才能再次参加。请利用这段时间认真复习资料。
                    </p>
                  </div>
                )}

                {studyCompleted && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 sm:mt-3">
                    考试开始后，学习资料将不可查看（闭卷）
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════
  // EXAM PHASE - Full screen, closed book
  // ═══════════════════════════════════════════
  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-scale-in">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">正在判卷...</p>
        </div>
      </div>
    )
  }

  const timeAlmostUp = timeLeft < 300 // 5 minutes warning
  const timeCritical = timeLeft < 60 // 1 minute

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* ── Exam Header ── */}
      <header className="shrink-0 border-b bg-background/95 backdrop-blur-xl z-20">
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg overflow-hidden bg-white/10">
              <img src="/logo-yaosiji.png" alt="姚司机" className="h-full w-full object-cover" />
            </div>
            <div>
              <span className="font-semibold text-xs sm:text-sm">闭卷考试</span>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">{user?.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Timer */}
            <div className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border transition-all ${
              timeCritical
                ? "bg-destructive/10 border-destructive/30 text-destructive animate-pulse-soft"
                : timeAlmostUp
                ? "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400"
                : "bg-muted border-border"
            }`}>
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="font-mono font-bold text-xs sm:text-sm">{formatTime(timeLeft)}</span>
            </div>

            {/* Progress - hide text on mobile */}
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{answeredCount}</span>
              <span>/ {EXAM_QUESTION_COUNT}</span>
              <div className="w-16 md:w-20 h-2 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${(answeredCount / EXAM_QUESTION_COUNT) * 100}%` }}
                />
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSkipExam}
              className="text-xs sm:text-sm px-2 sm:px-3 text-amber-600 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-900/20"
              title="跳过考试，直接激活成功"
            >
              跳过考试
            </Button>

            <Button
              variant="destructive"
              size="sm"
              disabled={!allAnswered}
              onClick={handleSubmitExam}
              className="text-xs sm:text-sm px-2 sm:px-3"
              title={!allAnswered ? `还有 ${EXAM_QUESTION_COUNT - answeredCount} 题未答` : ""}
            >
              <Send className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />{allAnswered ? "交卷" : `还有${EXAM_QUESTION_COUNT - answeredCount}题`}
            </Button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / EXAM_QUESTION_COUNT) * 100}%` }}
          />
        </div>
      </header>

      {/* ── Exam Body ── */}
      <div className="flex-1 flex overflow-hidden" id="exam-content-area">
        {/* Question Navigation - desktop: left sidebar */}
        <div className="hidden sm:flex flex-col w-[60px] md:w-[72px] lg:w-[88px] shrink-0 border-r bg-muted/20 p-2">
          <div className="grid grid-cols-3 gap-1.5 overflow-y-auto">
            {examQuestions.map((q, i) => {
              const isAns = !!answers[q.id]
              const isCur = i === currentIndex
              const canJump = isAns || isCur || i < currentIndex
              return (
                <button
                  key={q.id}
                  onClick={() => canJump && setCurrentIndex(i)}
                  disabled={!canJump}
                  className={`h-7 md:h-8 rounded-md text-xs font-medium transition-all ${
                    isCur
                      ? "bg-primary text-primary-foreground shadow-sm scale-110 ring-2 ring-primary/30"
                      : isAns
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                      : "bg-muted text-muted-foreground border border-transparent"
                  } ${!canJump ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
          <div className="mt-3 space-y-1.5 text-[10px] text-muted-foreground text-center">
            <div className="flex items-center gap-1 justify-center">
              <div className="h-2.5 w-2.5 rounded bg-emerald-300 dark:bg-emerald-600" />
              <span>已答</span>
            </div>
            <div className="flex items-center gap-1 justify-center">
              <div className="h-2.5 w-2.5 rounded bg-muted" />
              <span>未答</span>
            </div>
          </div>
        </div>

        {/* ── Question Number Strip - Mobile ── */}
        <div className="flex sm:hidden shrink-0 border-b bg-muted/20 overflow-x-auto px-2 py-1.5 gap-1">
          {examQuestions.map((q, i) => {
            const isAns = !!answers[q.id]
            const isCur = i === currentIndex
            const canJump = isAns || isCur || i < currentIndex
            return (
              <button
                key={q.id}
                onClick={() => canJump && setCurrentIndex(i)}
                disabled={!canJump}
                className={`h-7 min-w-[28px] shrink-0 rounded-md text-xs font-medium transition-all ${
                  isCur
                    ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/30"
                    : isAns
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                    : "bg-muted text-muted-foreground border border-transparent"
                } ${!canJump ? "opacity-40" : ""}`}
              >
                {i + 1}
              </button>
            )
          })}
        </div>

        {/* Current Question */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div key={currentIndex} className="max-w-2xl mx-auto animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <Badge
                  variant={
                    currentQ.type === "单选" ? "success" :
                    currentQ.type === "多选" ? "warning" : "outline"
                  }
                  className="text-xs"
                >
                  {currentQ.type}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {currentQ.score} 分 · 第 {currentIndex + 1}/{EXAM_QUESTION_COUNT} 题
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-medium leading-relaxed mb-6">
                {currentQ.title}
              </h3>

              {currentQ.type === "多选" && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-2 mb-4">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">多选题 — 请选择所有正确答案</p>
                </div>
              )}

              <div className="space-y-3">
                {currentQ.options.map((opt, oi) => {
                  const label = OPTION_LABELS[oi]
                  const sel = selectedAnswer.includes(label)
                  return (
                    <button
                      key={oi}
                      onClick={() =>
                        currentQ.type === "多选"
                          ? handleMultiSelect(label)
                          : handleSingleSelect(label)
                      }
                      className={`w-full text-left flex items-start gap-3 rounded-xl border-2 p-4 transition-all duration-200 ${
                        sel
                          ? currentQ.type === "多选"
                            ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-600 shadow-sm"
                            : "border-primary bg-primary/5 shadow-md"
                          : "border-border hover:border-muted-foreground/40 hover:bg-accent/50 hover:shadow-sm"
                      }`}
                    >
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm font-bold transition-all ${
                          sel
                            ? currentQ.type === "多选"
                              ? "bg-amber-500 text-white"
                              : "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {label}
                      </div>
                      <span className="text-sm sm:text-base pt-0.5 leading-relaxed">{opt}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Bottom Nav */}
          <div className="shrink-0 border-t bg-background p-3">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />上一题
              </Button>

              <div className="hidden sm:block text-xs text-muted-foreground">
                已答 <span className="font-semibold text-foreground">{answeredCount}</span>/{EXAM_QUESTION_COUNT}
                {answeredCount < EXAM_QUESTION_COUNT && (
                  <span className="text-amber-600 dark:text-amber-400 ml-1">
                    · 还剩 {EXAM_QUESTION_COUNT - answeredCount} 题未答
                  </span>
                )}
              </div>

              {currentIndex === EXAM_QUESTION_COUNT - 1 ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSkipExam}
                    className="text-amber-600 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-900/20"
                  >
                    跳过考试
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={!allAnswered}
                    onClick={handleSubmitExam}
                    title={!allAnswered ? `还有 ${EXAM_QUESTION_COUNT - answeredCount} 题未答` : ""}
                  >
                    <Send className="h-4 w-4 mr-1" />{allAnswered ? "交卷" : `还有${EXAM_QUESTION_COUNT - answeredCount}题`}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!currentAnswered}
                  onClick={() =>
                    setCurrentIndex((i) =>
                      Math.min(EXAM_QUESTION_COUNT - 1, i + 1)
                    )
                  }
                  title={!currentAnswered ? "请先作答本题" : ""}
                >
                  {!currentAnswered ? "请先作答" : <><span>下一题</span><ChevronRight className="h-4 w-4 ml-1" /></>}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
