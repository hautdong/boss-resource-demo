import { useState, useEffect, useRef, useCallback } from "react"
import { ChevronLeft, ChevronRight, Lock, CheckCircle2, EyeOff } from "lucide-react"
import { Button } from "./ui/button"
import { api } from "../lib/api"
import { useAuth } from "../context/AuthContext"

// ─── 阅读顺序：手册 → 规范 → 协议 ───
const READING_ORDER = ["manual", "rules", "agreement"] as const
type FileId = (typeof READING_ORDER)[number]

const FILE_TITLES: Record<FileId, string> = {
  manual: "BOSS直聘产品使用手册",
  rules: "招聘行为管理规范",
  agreement: "BOSS直聘用户协议",
}

// 文件间隐藏门槛（秒）
const FILE_THRESHOLDS: Record<FileId, number> = {
  manual: 900,  // 15 分钟
  rules: 300,   // 5 分钟
  agreement: 300, // 5 分钟
}

// 每页最低停留规则
const TITLE_CHAR_LIMIT = 60
const TITLE_MIN_SEC = 3
const CONTENT_MIN_SEC = 10

// ─── 类型 ───
interface PageInfo {
  pageNum: number
  charCount: number
  isTitle: boolean
}

interface FileMeta {
  id: FileId
  title: string
  pdfUrl: string
  pages: PageInfo[]
  totalPages: number
}

interface Progress {
  currentFile: FileId
  currentPage: number       // 1-indexed
  fileReadSeconds: Record<string, number>  // 每份资料累计阅读秒数
  completedFiles: string[]
}

// ─── localStorage 持久化 ───
function getStorageKey(uid?: string): string {
  return `boss-forced-reader-progress-${uid || "unknown"}`
}

function loadProgress(uid?: string): Progress | null {
  try {
    const raw = localStorage.getItem(getStorageKey(uid))
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveProgress(p: Progress, uid?: string) {
  localStorage.setItem(getStorageKey(uid), JSON.stringify(p))
}

function clearProgress(uid?: string) {
  localStorage.removeItem(getStorageKey(uid))
}

// ─── 组件 Props ───
interface ForcedReaderProps {
  adminSkip: boolean
  userId?: string
  onAllComplete: () => void
}

export default function ForcedReader({ adminSkip, userId, onAllComplete }: ForcedReaderProps) {
  const { user } = useAuth()
  // ─── 核心状态 ───
  const [files, setFiles] = useState<FileMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [pdfJsReady, setPdfJsReady] = useState(false)

  const [currentFile, setCurrentFile] = useState<FileId>("manual")
  const [currentPage, setCurrentPage] = useState(1)
  const [fileReadSeconds, setFileReadSeconds] = useState<Record<string, number>>({})
  const [completedFiles, setCompletedFiles] = useState<Set<string>>(new Set())
  const [allDone, setAllDone] = useState(false)

  // 翻转计时器：页面停留
  const [pageEnterTime, setPageEnterTime] = useState<number>(Date.now())
  const [pageMinStay, setPageMinStay] = useState(10)        // 本页最短停留秒数
  const [pageRemaining, setPageRemaining] = useState(10)
  const [pageReady, setPageReady] = useState(false)         // 本页时间到

  // 标签页失焦暂停
  const [isPaused, setIsPaused] = useState(false)
  const [showUnlockHint, setShowUnlockHint] = useState(false)
  const [unlockHintMsg, setUnlockHintMsg] = useState("")

  // Canvas & PDF 渲染
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pdfDocRef = useRef<any>(null)
  const timerRef = useRef<number>(0)
  const readSecondsRef = useRef<Record<string, number>>({})

  // 进度恢复标记
  const restoredRef = useRef(false)

  // ─── 加载 pdf.js CDN ───
  useEffect(() => {
    if ((window as any).pdfjsLib) {
      setPdfJsReady(true)
      return
    }
    const script = document.createElement("script")
    script.src = "/pdfjs/pdf.min.js"
    script.onload = () => {
      (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
        "/pdfjs/pdf.worker.min.js"
      setPdfJsReady(true)
    }
    script.onerror = () => {
      console.error("PDF.js CDN 加载失败")
      setLoading(false)
    }
    document.head.appendChild(script)
    return () => {
      if (script.parentNode) script.parentNode.removeChild(script)
    }
  }, [])

  // ─── 加载所有 PDF 并分析页面 ───
  useEffect(() => {
    if (!pdfJsReady) return

    const pdfjsLib = (window as any).pdfjsLib
    const pdfUrls = {
      manual: "/learning-materials/manual.pdf",
      rules: "/learning-materials/rules.pdf",
      agreement: "/learning-materials/agreement.pdf",
    }

    async function loadAll() {
      const result: FileMeta[] = []
      for (const fid of READING_ORDER) {
        const doc = await pdfjsLib.getDocument(pdfUrls[fid]).promise
        const pages: PageInfo[] = []
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i)
          const textContent = await page.getTextContent()
          const text = textContent.items.map((item: any) => item.str).join("")
          const charCount = text.replace(/\s/g, "").length
          pages.push({
            pageNum: i,
            charCount,
            isTitle: charCount <= TITLE_CHAR_LIMIT,
          })
        }
        result.push({
          id: fid,
          title: FILE_TITLES[fid],
          pdfUrl: pdfUrls[fid],
          pages,
          totalPages: doc.numPages,
        })
      }
      setFiles(result)

      // 恢复进度
      const saved = loadProgress(userId)
      if (saved && !restoredRef.current) {
        restoredRef.current = true
        setCurrentFile(saved.currentFile as FileId)
        setCurrentPage(saved.currentPage)
        setFileReadSeconds(saved.fileReadSeconds || {})
        readSecondsRef.current = saved.fileReadSeconds || {}
        setCompletedFiles(new Set(saved.completedFiles || []))
        if (saved.completedFiles?.length === 3) {
          setAllDone(true)
        }
      }
      setLoading(false)
    }

    loadAll()
  }, [pdfJsReady])

  // ─── 渲染当前页到 Canvas ───
  useEffect(() => {
    if (!pdfJsReady || files.length === 0) return
    const pdfjsLib = (window as any).pdfjsLib
    const fileMeta = files.find((f) => f.id === currentFile)
    if (!fileMeta) return

    pdfjsLib.getDocument(fileMeta.pdfUrl).promise.then((doc: any) => {
      pdfDocRef.current = doc
      doc.getPage(currentPage).then((page: any) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const viewport = page.getViewport({ scale: 1.5 })
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext("2d")!
        page.render({ canvasContext: ctx, viewport }).promise
      })
    })
  }, [pdfJsReady, files, currentFile, currentPage])

  // ─── 当前页最短停留时间 ───
  useEffect(() => {
    const fileMeta = files.find((f) => f.id === currentFile)
    if (!fileMeta) return
    const pageInfo = fileMeta.pages[currentPage - 1]
    if (!pageInfo) return
    const minStay = pageInfo.isTitle ? TITLE_MIN_SEC : CONTENT_MIN_SEC
    setPageMinStay(minStay)
    setPageRemaining(minStay)
    setPageReady(false)
    setPageEnterTime(Date.now())
  }, [currentFile, currentPage, files])

  // ─── 核心 Timer（每秒 tick）───
  useEffect(() => {
    if (loading || allDone) return

    timerRef.current = window.setInterval(() => {
      if (adminSkip) {
        setPageReady(true)
        setPageRemaining(0)
        return
      }

      if (!adminSkip && isPaused) return  // 暂停状态不计时

      // 更新单页剩余时间
      setPageRemaining((prev) => {
        const next = prev - 1
        if (next <= 0) {
          setPageReady(true)
          return 0
        }
        return next
      })

      // 更新文件累计阅读时间
      setFileReadSeconds((prev) => {
        const next = { ...prev }
        next[currentFile] = (next[currentFile] || 0) + 1
        readSecondsRef.current = next
        return next
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [loading, currentFile, allDone, adminSkip, isPaused])

  // ─── 保存进度（localStorage + API 同步）───
  useEffect(() => {
    if (loading) return
    const progress = {
      currentFile,
      currentPage,
      fileReadSeconds,
      completedFiles: Array.from(completedFiles),
    }
    saveProgress(progress, userId)
    // 同步到后端
    if (user?.id) {
      api.study.save(user.id, {
        fileId: currentFile,
        currentPage,
        readSeconds: fileReadSeconds[currentFile] || 0,
        completed: completedFiles.has(currentFile) ? 1 : 0,
      }).catch(() => {})
    }
  }, [currentFile, currentPage, fileReadSeconds, completedFiles, loading])

  // ─── 标签页失焦检测 ───
  useEffect(() => {
    const handleVisibility = () => {
      if (!adminSkip && document.hidden) {
        setIsPaused(true)
      } else if (!adminSkip) {
        setIsPaused(false)
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)
    return () => document.removeEventListener("visibilitychange", handleVisibility)
  }, [adminSkip])

  // ─── 判断文件是否解锁 ───
  const isFileUnlocked = useCallback(
    (targetFile: FileId): boolean => {
      if (adminSkip) return true
      const targetIdx = READING_ORDER.indexOf(targetFile)
      if (targetIdx === 0) return true
      const prevFile = READING_ORDER[targetIdx - 1]
      const seconds = fileReadSeconds[prevFile] || 0
      return seconds >= FILE_THRESHOLDS[prevFile]
    },
    [fileReadSeconds, adminSkip]
  )

  // ─── 判断是否能标记"已学习" ───
  const canMarkComplete = useCallback((): boolean => {
    if (adminSkip) return true
    const agreementSeconds = fileReadSeconds["agreement"] || 0
    return (
      completedFiles.has("manual") &&
      completedFiles.has("rules") &&
      completedFiles.has("agreement") &&
      agreementSeconds >= FILE_THRESHOLDS["agreement"]
    )
  }, [fileReadSeconds, completedFiles, adminSkip])

  // ─── 翻页 ───
  const goToPage = useCallback(
    (delta: number) => {
      const fileMeta = files.find((f) => f.id === currentFile)
      if (!fileMeta) return
      const newPage = currentPage + delta
      if (newPage < 1 || newPage > fileMeta.totalPages) return
      setCurrentPage(newPage)
    },
    [currentFile, currentPage, files]
  )

  // ─── 切换文件 ───
  const switchFile = useCallback(
    (targetFile: FileId) => {
      if (targetFile === currentFile) return
      if (!isFileUnlocked(targetFile) && !adminSkip) {
        setUnlockHintMsg("请先完成当前资料的阅读")
        setShowUnlockHint(true)
        setTimeout(() => setShowUnlockHint(false), 2500)
        return
      }
      setCurrentFile(targetFile)
      setCurrentPage(1)
    },
    [currentFile, isFileUnlocked, adminSkip]
  )

  // ─── 标记当前文件为已完成 ───
  const markFileComplete = useCallback(() => {
    const currentIdx = READING_ORDER.indexOf(currentFile)
    const currentSeconds = fileReadSeconds[currentFile] || 0
    if (currentSeconds < FILE_THRESHOLDS[currentFile] && !adminSkip) {
      setUnlockHintMsg("请先完成当前资料的阅读")
      setShowUnlockHint(true)
      setTimeout(() => setShowUnlockHint(false), 2500)
      return
    }
    const nextCompleted = new Set(completedFiles)
    nextCompleted.add(currentFile)
    setCompletedFiles(nextCompleted)

    // 如果是最后一个文件 → 全部完成
    if (currentIdx === READING_ORDER.length - 1) {
      setAllDone(true)
      clearProgress(userId)
      onAllComplete()
      return
    }

    // 自动跳到下一个文件
    const nextFile = READING_ORDER[currentIdx + 1]
    setCurrentFile(nextFile)
    setCurrentPage(1)
  }, [currentFile, fileReadSeconds, completedFiles, adminSkip, onAllComplete])

  // ─── 格式化时间 ───
  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    if (m > 0) return `${m}分${s}秒`
    return `${s}秒`
  }

  // ─── 加载状态 ───
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">正在加载学习资料...</p>
        </div>
      </div>
    )
  }

  const fileMeta = files.find((f) => f.id === currentFile)
  const totalFiles = files.length
  const currentFileIdx = READING_ORDER.indexOf(currentFile)
  const totalPagesRead = files
    .filter((f) => READING_ORDER.indexOf(f.id as FileId) < currentFileIdx)
    .reduce((sum, f) => sum + f.totalPages, 0) + currentPage

  const totalPagesAll = files.reduce((sum, f) => sum + f.totalPages, 0)

  // ─── 全部完成状态 ───
  if (allDone) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6">
        <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold">全部学习完毕！</h3>
          <p className="text-muted-foreground">你可以开始考试了</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* ─── 暂停遮罩 ─── */}
      {isPaused && !adminSkip && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-2xl max-w-sm mx-4">
            <div className="text-5xl mb-4">⏸️</div>
            <h3 className="text-xl font-bold mb-2">学习已暂停</h3>
            <p className="text-muted-foreground">检测到你离开了页面，计时已暂停。</p>
            <p className="text-muted-foreground mt-1">请回到本页面继续学习。</p>
          </div>
        </div>
      )}

      {/* ─── 提示弹窗 ─── */}
      {showUnlockHint && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 bg-amber-50 dark:bg-amber-900/80 border border-amber-300 dark:border-amber-700 rounded-lg px-6 py-3 shadow-lg animate-bounce">
          <p className="text-amber-800 dark:text-amber-200 font-medium flex items-center gap-2">
            <Lock className="h-4 w-4" />
            {unlockHintMsg}
          </p>
        </div>
      )}

      {/* ─── 顶部状态栏 ─── */}
      <div className="bg-muted/50 rounded-xl p-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{fileMeta?.title}</span>
          <span className="text-xs text-muted-foreground">
            {totalPagesRead}/{totalPagesAll} 页
          </span>
        </div>
        {/* 文件标签切换 */}
        <div className="flex gap-2 mt-3">
          {files.map((f) => {
            const unlocked = isFileUnlocked(f.id)
            const isActive = f.id === currentFile
            const isDone = completedFiles.has(f.id)
            return (
              <button
                key={f.id}
                onClick={() => switchFile(f.id)}
                disabled={!unlocked}
                className={`flex-1 text-xs py-2 px-2 rounded-lg border transition-all
                  ${isActive
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : isDone
                    ? "border-green-300 bg-green-50 dark:bg-green-900/20 text-green-600"
                    : unlocked
                    ? "border-border bg-background hover:bg-accent cursor-pointer"
                    : "border-border bg-muted/30 text-muted-foreground cursor-not-allowed"
                  }`}
              >
                <div className="flex items-center justify-center gap-1">
                  {isDone ? (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  ) : !unlocked ? (
                    <Lock className="h-3 w-3" />
                  ) : null}
                  <span className="truncate">{f.title}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ─── PDF 页面渲染区 ─── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border overflow-hidden">
        <div className="flex items-center justify-center p-2 bg-muted/30">
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-[60vh] object-contain rounded"
          />
        </div>
        {/* 文本预览（标题页额外显示文字） */}
        {fileMeta && fileMeta.pages[currentPage - 1]?.isTitle && (
          <div className="p-4 text-center text-sm text-muted-foreground border-t">
            {fileMeta.pages[currentPage - 1]?.charCount > 0
              ? "（标题 / 过渡页面）"
              : "（空白页）"}
          </div>
        )}
      </div>

      {/* ─── 页数 & 倒计时 ─── */}
      <div className="flex items-center justify-between mt-3 text-sm">
        <span className="text-muted-foreground">
          第 {currentPage} / {fileMeta?.totalPages} 页
        </span>
        {!pageReady && !adminSkip ? (
          <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
            <EyeOff className="h-3.5 w-3.5" />
            {pageRemaining > 0 ? `还需停留 ${pageRemaining}s` : "准备翻页"}
          </span>
        ) : (
          <span className="text-green-600 dark:text-green-400 font-medium">✓ 可翻页</span>
        )}
      </div>

      {/* ─── 导航按钮 ─── */}
      <div className="flex items-center justify-between mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(-1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          上一页
        </Button>

        {currentPage === (fileMeta?.totalPages || 1) ? (
          <Button
            size="sm"
            onClick={markFileComplete}
            disabled={!pageReady && !adminSkip}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            完成本资料
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(1)}
            disabled={!pageReady && !adminSkip}
          >
            下一页
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>

      {/* ─── 管理员跳过提示 ─── */}
      {adminSkip && (
        <div className="mt-4 text-center">
          <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-3 py-1 rounded-full">
            ⚡ 管理员模式：已跳过阅读限制
          </span>
        </div>
      )}
    </div>
  )
}
