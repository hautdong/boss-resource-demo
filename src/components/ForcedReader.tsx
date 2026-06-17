import { useState, useEffect, useRef, useCallback } from "react"
import { ChevronLeft, ChevronRight, Lock, CheckCircle2, EyeOff } from "lucide-react"
import { Button } from "./ui/button"
import { api } from "../lib/api"
import { useAuth } from "../context/AuthContext"

const READING_ORDER = ["manual", "rules", "agreement"] as const
type FileId = (typeof READING_ORDER)[number]

const FILE_TITLES: Record<FileId, string> = {
  manual: "BOSS直聘产品使用手册",
  rules: "招聘行为管理规范",
  agreement: "BOSS直聘用户协议",
}

const FILE_THRESHOLDS: Record<FileId, number> = {
  manual: 0,
  rules: 0,
  agreement: 0,
}

// ─── 类型 ───
interface PageInfo {
  pageNum: number
  charCount: number
  minSec: number
}
interface FileMeta {
  id: FileId
  title: string
  totalPages: number
  pages: PageInfo[]
}

// ─── localStorage ───
function getStorageKey(uid?: string): string {
  return `boss-forced-reader-progress-${uid || "unknown"}`
}
function clearProgress(uid?: string) {
  localStorage.removeItem(getStorageKey(uid))
}

interface ForcedReaderProps {
  adminSkip: boolean
  userId?: string
  onAllComplete: () => void
}

export default function ForcedReader({ adminSkip, userId, onAllComplete }: ForcedReaderProps) {
  const { user } = useAuth()
  const [files, setFiles] = useState<FileMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [currentFile, setCurrentFile] = useState<FileId>("manual")
  const [currentPage, setCurrentPage] = useState(1)
  const [completedFiles, setCompletedFiles] = useState<Set<string>>(new Set())
  const [allDone, setAllDone] = useState(false)

  // 计时相关
  const [pageEnterTime, setPageEnterTime] = useState(Date.now())
  const [pageMinSec, setPageMinSec] = useState(15)
  const [pageRemaining, setPageRemaining] = useState(15)
  const [pageReady, setPageReady] = useState(true)
  const timerRef = useRef<number>(0)

  // 加载字数配置
  useEffect(() => {
    fetch("/page-counts.json")
      .then(r => r.json())
      .then(data => {
        const loaded: FileMeta[] = []
        for (const fid of READING_ORDER) {
          const d = data[fid]
          if (d) loaded.push({ id: fid, title: FILE_TITLES[fid], totalPages: d.totalPages, pages: d.pages })
        }
        setFiles(loaded)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // 进入新页面时重置计时
  useEffect(() => {
    if (!files.length) return
    const fileMeta = files.find(f => f.id === currentFile)
    if (!fileMeta) return
    const info = fileMeta.pages[currentPage - 1]
    if (!info) return
    const sec = adminSkip ? 0 : info.minSec
    setPageMinSec(sec)
    setPageRemaining(sec)
    setPageReady(sec === 0)
    setPageEnterTime(Date.now())
  }, [currentFile, currentPage, files, adminSkip])

  // 每秒 tick
  useEffect(() => {
    if (loading || allDone || adminSkip) return
    timerRef.current = window.setInterval(() => {
      setPageRemaining(prev => {
        const next = prev - 1
        if (next <= 0) { setPageReady(true); return 0 }
        return next
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [loading, currentFile, allDone, adminSkip])

  const isFileUnlocked = useCallback(
    (targetFile: FileId): boolean => {
      if (adminSkip) return true
      const idx = READING_ORDER.indexOf(targetFile)
      if (idx === 0) return true
      return completedFiles.has(READING_ORDER[idx - 1])
    },
    [completedFiles, adminSkip]
  )

  const switchFile = useCallback(
    (targetFile: FileId) => {
      if (targetFile === currentFile) return
      if (!isFileUnlocked(targetFile) && !adminSkip) return
      setCurrentFile(targetFile)
      setCurrentPage(1)
    },
    [currentFile, isFileUnlocked, adminSkip]
  )

  const markFileComplete = useCallback(() => {
    const idx = READING_ORDER.indexOf(currentFile)
    const nextCompleted = new Set(completedFiles)
    nextCompleted.add(currentFile)
    setCompletedFiles(nextCompleted)
    if (user?.id) {
      api.study.save(user.id, { fileId: currentFile, currentPage, completed: 1 }).catch(() => {})
    }
    if (idx === READING_ORDER.length - 1) {
      setAllDone(true)
      clearProgress(userId)
      onAllComplete()
      return
    }
    setCurrentFile(READING_ORDER[idx + 1])
    setCurrentPage(1)
  }, [currentFile, currentPage, completedFiles, onAllComplete, user, userId])

  const goToPage = useCallback(
    (delta: number) => {
      const fileMeta = files.find(f => f.id === currentFile)
      if (!fileMeta) return
      const newPage = currentPage + delta
      if (newPage < 1 || newPage > fileMeta.totalPages) return
      setCurrentPage(newPage)
      if (user?.id) {
        api.study.save(user.id, { fileId: currentFile, currentPage: newPage, completed: 0 }).catch(() => {})
      }
    },
    [currentFile, currentPage, files, user]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">加载学习资料...</p>
        </div>
      </div>
    )
  }

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

  const pdfUrls: Record<FileId, string> = {
    manual: "/learning-materials/manual.pdf",
    rules: "/learning-materials/rules.pdf",
    agreement: "/learning-materials/agreement.pdf",
  }
  const fileMeta = files.find(f => f.id === currentFile)
  const isLastPage = currentPage === (fileMeta?.totalPages || 0)
  const canTurnPage = pageReady || adminSkip

  return (
    <div className="relative">
      {/* ─── 顶部标签切换 ─── */}
      <div className="bg-muted/50 rounded-xl p-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{fileMeta?.title}</span>
          <span className="text-xs text-muted-foreground">
            {currentPage}/{fileMeta?.totalPages || 0} 页
          </span>
        </div>
        <div className="flex gap-2">
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
                  {isDone ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : !unlocked ? <Lock className="h-3 w-3" /> : null}
                  <span className="truncate">{f.title}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ─── PDF iframe 渲染 ── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border overflow-hidden">
        <iframe
          src={`${pdfUrls[currentFile]}#page=${currentPage}`}
          className="w-full h-[60vh] border-0"
          title="PDF Viewer"
        />
      </div>

      {/* ─── 底部控制栏 ─── */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            第 {currentPage} / {fileMeta?.totalPages || 0} 页
          </span>
          {!canTurnPage && (
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
              <EyeOff className="h-3 w-3" />
              还需 {pageRemaining}s
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => goToPage(-1)} disabled={currentPage <= 1}>
            <ChevronLeft className="h-4 w-4" /> 上一页
          </Button>
          {isLastPage ? (
            <Button size="sm" onClick={markFileComplete} className="bg-green-600 hover:bg-green-700 text-white">
              <CheckCircle2 className="h-4 w-4 mr-1" /> 完成本资料
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => goToPage(1)} disabled={!canTurnPage}>
              下一页 <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
