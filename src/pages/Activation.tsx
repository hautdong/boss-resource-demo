import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import {
  BookOpen, FileText, GraduationCap, CheckCircle2, XCircle,
  AlertCircle, Clock, Trophy, Loader2,
  BookMarked, ChevronLeft, ChevronRight, ChevronDown, Send,
  Maximize2, Minimize2, ArrowLeft, LogOut, RefreshCw
} from "lucide-react"
import questions from "../data/examQuestions"

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"]
const EXAM_QUESTION_COUNT = 20
const PASS_SCORE = 60
const EXAM_TIME = 1200 // 20 minutes

const learningMaterials = [
  {
    id: "manual",
    title: "BOSS直聘产品使用手册",
    file: "/learning-materials/【BOSS直聘产品使用手册】培训.pdf",
    icon: BookMarked,
    color: "text-indigo-500",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
  },
  {
    id: "rules",
    title: "招聘行为管理规范",
    file: "/learning-materials/招聘行为管理规范【规则】.pdf",
    icon: FileText,
    color: "text-amber-500",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
  {
    id: "agreement",
    title: "BOSS直聘用户协议",
    file: "/learning-materials/BOSS直聘用户协议.pdf",
    icon: BookOpen,
    color: "text-emerald-500",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
  },
]

type Phase = "intro" | "study" | "exam" | "result"

export default function Activation() {
  const navigate = useNavigate()
  const { user, completeExam, logout } = useAuth()

  // ── Phase control ──
  const [phase, setPhase] = useState<Phase>("intro")

  // ── Learning state ──
  const [activeMaterial, setActiveMaterial] = useState("manual")
  const [studiedMaterials, setStudiedMaterials] = useState<Set<string>>(new Set())
  const [leftExpanded, setLeftExpanded] = useState(false)

  // ── Exam state ──
  const [examAttempt, setExamAttempt] = useState(1)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string[]>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(EXAM_TIME)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [showReview, setShowReview] = useState(false)

  const allStudied = studiedMaterials.size === learningMaterials.length

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

  // ── Handlers ──
  const toggleStudied = useCallback((id: string) => {
    setStudiedMaterials((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

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

  const handleSubmitExam = () => {
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
    completeExam(totalScore, passed)
    setTimeout(() => setPhase("result"), 800)
  }

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`

  const correctCount = submitted
    ? examQuestions.filter((q) => {
        const ua = answers[q.id]
        if (!ua) return false
        return ua.length === q.answer.length && ua.every((a) => q.answer.includes(a))
      }).length
    : 0

  const activeMaterialData = learningMaterials.find(m => m.id === activeMaterial)!

  // ═══════════════════════════════════════════
  // INTRO PHASE
  // ═══════════════════════════════════════════
  if (phase === "intro") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-6">
        <div className="w-full max-w-xl animate-fade-in">
          <button
            onClick={() => { logout(); navigate("/login", { replace: true }) }}
            className="absolute top-6 left-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            返回登录
          </button>

          <div className="text-center mb-8">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full overflow-hidden mb-6 ring-4 ring-primary/20">
              <img src="/logo-yaosiji.png" alt="姚司机" className="h-full w-full object-cover" />
            </div>
            <h1 className="text-3xl font-bold gradient-text">姚司机 · 账号激活</h1>
            <p className="text-muted-foreground mt-2">
              欢迎你，<span className="font-semibold text-foreground">{user?.name}</span>！
            </p>
            <Badge variant="outline" className="mt-2 border-amber-400 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-3 w-3 mr-1" />
              成员BOSS 需完成学习与考试才能激活账号
            </Badge>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                  <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold">第一步：学习资料</h3>
                  <p className="text-sm text-muted-foreground">阅读 3 份培训资料，标记为已学习</p>
                </div>
              </div>
              <div className="grid gap-2">
                {learningMaterials.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <m.icon className={`h-4 w-4 ${m.color}`} />
                    <span>{m.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">第二步：闭卷考试</h3>
                  <p className="text-sm text-muted-foreground">
                    从题库随机抽 20 题 · 满分 100 分 · 通过线 60 分 · 限时 20 分钟
                  </p>
                </div>
              </div>
            </div>

            <Button variant="primary" className="w-full" size="lg" onClick={() => setPhase("study")}>
              <BookOpen className="h-5 w-5 mr-2" />
              进入学习与考试
            </Button>
          </div>
        </div>
      </div>
    )
  }

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
              {passed ? "恭喜，考试通过！账号已激活 🎉" : "考试未通过"}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {passed
                ? "你的账号已成功激活，可以进入系统使用了"
                : `得分 ${score}/100，未达到通过线 ${PASS_SCORE} 分`}
            </p>

            {/* Score display */}
            <div className="mb-4">
              <div className="flex justify-center items-baseline gap-2 mb-2">
                <span className="text-4xl sm:text-5xl font-bold gradient-text">{score}</span>
                <span className="text-base sm:text-lg text-muted-foreground">/ 100</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden max-w-sm mx-auto">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${passed ? "bg-emerald-500" : "bg-destructive"}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
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
                <Button variant="primary" className="w-full" onClick={() => navigate("/", { replace: true })}>
                  <CheckCircle2 className="h-5 w-5 mr-2" />进入工作台
                </Button>
                <Button variant="outline" className="w-full" onClick={() => { logout(); navigate("/login", { replace: true }) }}>
                  <LogOut className="h-4 w-4 mr-2" />返回登录
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-w-sm mx-auto">
                <Button variant="destructive" className="w-full" onClick={startExam}>
                  <RefreshCw className="h-5 w-5 mr-2" />重新考试（换新题）
                </Button>
                <Button variant="outline" className="w-full" onClick={() => {
                  setPhase("study")
                  setStudiedMaterials(new Set())
                  resetExam()
                }}>
                  <BookOpen className="h-5 w-5 mr-2" />重新学习
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
                onClick={() => setShowReview(!showReview)}
                className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
                    <XCircle className="h-4 w-4 text-destructive" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-sm">错题回顾</h3>
                    <p className="text-xs text-muted-foreground">
                      {wrongQuestions.length} 题答错，点击查看正确答案
                    </p>
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                  showReview ? "rotate-180" : ""
                }`} />
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
    )
  }

  // ═══════════════════════════════════════════
  // STUDY PHASE - Left: PDF Viewer | Right: Exam prep
  // ═══════════════════════════════════════════
  if (phase === "study") {
    return (
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        <header className="shrink-0 border-b bg-background/95 backdrop-blur-xl z-20">
          <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg overflow-hidden">
              <img src="/logo-yaosiji.png" alt="姚司机" className="h-full w-full object-cover" />
            </div>
            <span className="font-semibold text-sm">学习资料</span>
              <Badge variant="outline" className="text-xs">
                {user?.name} ({user?.roleLabel})
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { logout(); navigate("/login", { replace: true }) }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                title="退出并返回登录"
              >
                <LogOut className="h-3.5 w-3.5" />
                退出
              </button>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">学习进度</span>
                <div className="flex gap-1">
                  {learningMaterials.map(m => (
                    <div
                      key={m.id}
                      className={`h-2 w-6 rounded-full transition-colors ${
                        studiedMaterials.has(m.id) ? "bg-emerald-500" : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-muted-foreground">{studiedMaterials.size}/{learningMaterials.length}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* ━━ LEFT: PDF Viewer ━━ */}
          <div
            className={`relative flex flex-col border-r bg-card transition-all duration-300 ${
              leftExpanded ? "lg:w-[65%]" : "lg:w-[50%]"
            } flex-1 lg:flex-none min-h-[45vh] lg:min-h-0`}
          >
            {/* Material Tabs */}
            <div className="shrink-0 border-b bg-muted/30">
              <div className="flex items-center px-2">
                {learningMaterials.map((m) => {
                  const isActive = activeMaterial === m.id
                  const isStudied = studiedMaterials.has(m.id)
                  return (
                    <button
                      key={m.id}
                      onClick={() => setActiveMaterial(m.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                        isActive
                          ? "border-primary text-primary bg-background"
                          : "border-transparent text-muted-foreground hover:text-foreground hover:bg-background/50"
                      }`}
                    >
                      <m.icon className={`h-4 w-4 ${m.color}`} />
                      <span className="truncate max-w-[120px]">{m.title}</span>
                      {isStudied && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 relative overflow-hidden">
              <iframe
                key={activeMaterial}
                src={activeMaterialData.file}
                className="absolute inset-0 w-full h-full border-0"
                title={activeMaterialData.title}
              />
              <button
                onClick={() => setLeftExpanded(!leftExpanded)}
                className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm border shadow-sm hover:bg-accent transition-colors"
                title={leftExpanded ? "收起" : "展开"}
              >
                {leftExpanded
                  ? <Minimize2 className="h-4 w-4" />
                  : <Maximize2 className="h-4 w-4" />
                }
              </button>
            </div>

            {/* Bottom: Mark as studied */}
            <div className="shrink-0 border-t bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {learningMaterials.map(m => {
                    const isStudied = studiedMaterials.has(m.id)
                    const isActive = activeMaterial === m.id
                    return (
                      <button
                        key={m.id}
                        onClick={() => setActiveMaterial(m.id)}
                        className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full transition-all ${
                          isStudied
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : isActive
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {isStudied ? <CheckCircle2 className="h-3 w-3" /> : <m.icon className="h-3 w-3" />}
                        <span className="hidden sm:inline">{m.title}</span>
                      </button>
                    )
                  })}
                </div>
                <Button
                  variant={studiedMaterials.has(activeMaterial) ? "outline" : "primary"}
                  size="sm"
                  className={studiedMaterials.has(activeMaterial) ? "text-emerald-600 border-emerald-300 dark:border-emerald-700" : ""}
                  onClick={() => toggleStudied(activeMaterial)}
                >
                  {studiedMaterials.has(activeMaterial) ? (
                    <><CheckCircle2 className="h-4 w-4 mr-1" />已学习</>
                  ) : (
                    <><BookMarked className="h-4 w-4 mr-1" />标记已学习</>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* ━━ RIGHT: Exam Prep ━━ */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="w-full max-w-md animate-fade-in text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-6">
                  <GraduationCap className="h-8 w-8 text-primary" />
                </div>

                <h2 className="text-xl font-bold mb-2">📝 闭卷考试</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  请在左侧阅读并学习全部资料，标记完成后即可开始考试
                </p>

                <div className="rounded-xl bg-muted/50 p-4 mb-6 text-sm space-y-2 text-left">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">题目数量</span>
                    <span className="font-semibold">{EXAM_QUESTION_COUNT} 题（随机抽选）</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">题型</span>
                    <span className="font-semibold">单选 + 多选 + 判断</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">总分</span>
                    <span className="font-semibold">100 分</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">通过线</span>
                    <span className="font-semibold text-emerald-600">60 分</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">考试模式</span>
                    <span className="font-semibold text-amber-600">⏱ 闭卷 · 限时 20 分钟</span>
                  </div>
                </div>

                {!allStudied && (
                  <div className="flex items-center gap-2 justify-center text-amber-600 dark:text-amber-400 text-sm mb-4">
                    <AlertCircle className="h-4 w-4" />
                    还需学习 {learningMaterials.length - studiedMaterials.size} 份资料
                  </div>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={!allStudied}
                  onClick={startExam}
                >
                  {allStudied ? (
                    <><GraduationCap className="h-5 w-5 mr-2" />开始考试</>
                  ) : (
                    <><BookOpen className="h-5 w-5 mr-2" />请先完成资料学习</>
                  )}
                </Button>

                {allStudied && (
                  <p className="text-xs text-muted-foreground mt-3">
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
              variant="destructive"
              size="sm"
              onClick={handleSubmitExam}
              className="text-xs sm:text-sm px-2 sm:px-3"
            >
              <Send className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />交卷
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
      <div className="flex-1 flex overflow-hidden">
        {/* Question Navigation - desktop: left sidebar */}
        <div className="hidden sm:flex flex-col w-[60px] md:w-[72px] lg:w-[88px] shrink-0 border-r bg-muted/20 p-2">
          <div className="grid grid-cols-3 gap-1.5 overflow-y-auto">
            {examQuestions.map((q, i) => {
              const isAns = !!answers[q.id]
              const isCur = i === currentIndex
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-7 md:h-8 rounded-md text-xs font-medium transition-all ${
                    isCur
                      ? "bg-primary text-primary-foreground shadow-sm scale-110 ring-2 ring-primary/30"
                      : isAns
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                      : "bg-muted text-muted-foreground hover:bg-accent border border-transparent"
                  }`}
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
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(i)}
                className={`h-7 min-w-[28px] shrink-0 rounded-md text-xs font-medium transition-all ${
                  isCur
                    ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/30"
                    : isAns
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                    : "bg-muted text-muted-foreground border border-transparent"
                }`}
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
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleSubmitExam}
                >
                  <Send className="h-4 w-4 mr-1" />交卷
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentIndex((i) =>
                      Math.min(EXAM_QUESTION_COUNT - 1, i + 1)
                    )
                  }
                >
                  下一题<ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
