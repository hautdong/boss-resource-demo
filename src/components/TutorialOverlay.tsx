import { useState, useEffect, useRef, useCallback } from "react"
import { ChevronRight } from "lucide-react"

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface StageConfig {
  targetSelector: string | undefined
  title: string
  description: string
}

interface TutorialOverlayProps {
  visible: boolean
  stepIndex: number
  totalSteps: number
  stages: StageConfig[]
  onNext: () => void
  onSkip: () => void
  interactive?: boolean
}

const PAD = 12

function GuideCard({
  stepIndex,
  totalSteps,
  stageIdx,
  totalStages,
  title,
  desc,
  onNext,
  onSkip,
  interactive,
}: {
  stepIndex: number
  totalSteps: number
  stageIdx: number
  totalStages: number
  title: string
  desc: string
  onNext: () => void
  onSkip: () => void
  interactive?: boolean
}) {
  const isLastStage = stageIdx >= totalStages - 1

  return (
    <div className="rounded-2xl border-2 border-amber-300/60 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden w-full max-w-sm">
      <div className="h-1 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300" />
      <div className="p-5">
        {/* Step-level progress dots */}
        <div className="flex items-center gap-1 mb-2">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all flex-1 ${
                i < stepIndex
                  ? "bg-emerald-400"
                  : i === stepIndex
                  ? "bg-amber-400"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            />
          ))}
        </div>

        {/* Sub-stage dots (only if multi-stage) */}
        {totalStages > 1 && (
          <div className="flex items-center gap-1.5 mb-3">
            {Array.from({ length: totalStages }, (_, i) => (
              <div
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition-all ${
                  i <= stageIdx ? "bg-amber-400 scale-125" : "bg-gray-300 dark:bg-gray-600"
                }`}
              />
            ))}
            <span className="text-[10px] text-gray-400 ml-1">
              {stageIdx + 1}/{totalStages}
            </span>
          </div>
        )}

        <div className="flex items-start gap-3 mb-4">
          <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-yellow-500 shadow-lg shadow-amber-400/30">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white">
              <path
                d="M7 11.5C7 10.12 8.12 9 9.5 9C9.67 9 9.83 9.03 10 9.08V5.5C10 4.67 10.67 4 11.5 4C12.33 4 13 4.67 13 5.5V8.5C13 8.5 14 7.5 15.5 7.5C16.33 7.5 17 8.17 17 9V12.5L17 14.5C17 17.54 14.54 20 11.5 20C9.5 20 7.79 18.72 7.09 16.95C6.92 16.54 6.77 16.12 6.64 15.69L5.94 13.58C5.67 12.73 6.04 11.83 6.87 11.52C6.96 11.48 7.05 11.46 7.14 11.45C7.05 11.31 7 11.14 7 11Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
              {desc}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <button
            onClick={onSkip}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            跳过教程
          </button>
          {interactive ? (
            totalStages > 1 ? (
              <span className="text-[10px] text-amber-500 font-medium">
                👆 点击高亮区域进入下一步
              </span>
            ) : (
              <span className="text-[10px] text-amber-500 font-medium">
                👆 点击高亮区域继续
              </span>
            )
          ) : (
            <button
              onClick={onNext}
              className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-4 py-1.5 text-xs font-semibold shadow-md hover:from-amber-600 hover:to-yellow-600 transition-all active:scale-95"
            >
              {stepIndex >= totalSteps - 1 ? "完成教程" : "下一步"}
              {stepIndex < totalSteps - 1 && <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TutorialOverlay({
  visible,
  stepIndex,
  totalSteps,
  stages,
  onNext,
  onSkip,
  interactive = false,
}: TutorialOverlayProps) {
  const [spotlight, setSpotlight] = useState<Rect | null>(null)
  const [cardBelow, setCardBelow] = useState(true)
  const [stageIdx, setStageIdx] = useState(0)
  const raf = useRef(0)

  // Reset stageIdx when stages change (step changed)
  useEffect(() => {
    setStageIdx(0)
  }, [stages])

  const currentStage = stages[stageIdx]
  const targetSelector = currentStage?.targetSelector

  const findSpotlight = useCallback(() => {
    if (!targetSelector) {
      setSpotlight(null)
      return
    }
    const el = document.querySelector(targetSelector)
    if (!el) {
      setSpotlight(null)
      return
    }
    const r = el.getBoundingClientRect()
    const ww = window.innerWidth
    const wh = window.innerHeight
    const rect: Rect = {
      x: Math.max(0, r.x - PAD),
      y: Math.max(0, r.y - PAD),
      width: Math.min(ww - r.x, r.width + PAD * 2),
      height: Math.min(wh - r.y, r.height + PAD * 2),
    }
    if (rect.x + rect.width > ww) rect.width = ww - rect.x
    if (rect.y + rect.height > wh) rect.height = wh - rect.y
    setSpotlight(rect)
    setCardBelow(rect.y + rect.height + 220 < wh)
  }, [targetSelector])

  // Scroll target into view when stage changes
  useEffect(() => {
    if (!visible || !targetSelector) return
    const el = document.querySelector(targetSelector)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [visible, targetSelector, stageIdx])

  useEffect(() => {
    if (!visible) return
    findSpotlight()
    const loop = () => {
      findSpotlight()
      raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)
    window.addEventListener("resize", findSpotlight)
    window.addEventListener("scroll", findSpotlight, true)
    return () => {
      cancelAnimationFrame(raf.current)
      window.removeEventListener("resize", findSpotlight)
      window.removeEventListener("scroll", findSpotlight, true)
    }
  }, [visible, findSpotlight])

  // Interactive mode: clicking highlighted area advances stage or calls onNext
  useEffect(() => {
    if (!visible || !interactive || !targetSelector) return
    const el = document.querySelector(targetSelector)
    if (!el) return

    const handler = (e: Event) => {
      // Small delay to let the actual click handler fire first
      setTimeout(() => {
        if (stageIdx < stages.length - 1) {
          setStageIdx((s) => s + 1)
        } else {
          onNext()
        }
      }, 300)
    }

    el.addEventListener("click", handler)
    return () => el.removeEventListener("click", handler)
  }, [visible, interactive, targetSelector, stageIdx, stages.length, onNext])

  if (!visible || stages.length === 0 || !currentStage) return null

  const progress = Math.round(((stepIndex + 1) / totalSteps) * 100)

  return (
    <>
      {/* Top progress bar */}
      <div className="fixed top-0 left-0 right-0 z-[100001] h-1 bg-black/30 backdrop-blur-sm">
        <div
          className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Visual mask SVG */}
      <svg
        className="fixed inset-0 z-[99999]"
        style={{ pointerEvents: "none" }}
        width="100%"
        height="100%"
      >
        <defs>
          <mask id="tut-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotlight && (
              <rect
                x={spotlight.x}
                y={spotlight.y}
                width={spotlight.width}
                height={spotlight.height}
                rx={16}
                fill="black"
              />
            )}
          </mask>
          <linearGradient id="tut-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.55)"
          mask="url(#tut-mask)"
        />
        {spotlight && (
          <>
            <rect
              x={spotlight.x - 2}
              y={spotlight.y - 2}
              width={spotlight.width + 4}
              height={spotlight.height + 4}
              rx={17}
              fill="none"
              stroke="url(#tut-glow)"
              strokeWidth="2.5"
              opacity="0.6"
            >
              <animate
                attributeName="opacity"
                values="0.6;0.2;0.6"
                dur="2s"
                repeatCount="indefinite"
              />
            </rect>
            <rect
              x={spotlight.x - 1}
              y={spotlight.y - 1}
              width={spotlight.width + 2}
              height={spotlight.height + 2}
              rx={16}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.5"
              strokeDasharray="8 4"
            >
              <animate
                attributeName="stroke-dashoffset"
                values="0;-24"
                dur="0.8s"
                repeatCount="indefinite"
              />
            </rect>
          </>
        )}
      </svg>

      {/* Click-blocking walls */}
      {spotlight ? (
        <>
          <div
            className="fixed left-0 right-0 z-[100000]"
            style={{ top: 0, height: `${spotlight.y}px` }}
          />
          <div
            className="fixed left-0 right-0 z-[100000]"
            style={{
              top: `${spotlight.y + spotlight.height}px`,
              height: `calc(100vh - ${spotlight.y + spotlight.height}px)`,
            }}
          />
          <div
            className="fixed z-[100000]"
            style={{
              top: `${spotlight.y}px`,
              left: 0,
              width: `${spotlight.x}px`,
              height: `${spotlight.height}px`,
            }}
          />
          <div
            className="fixed z-[100000]"
            style={{
              top: `${spotlight.y}px`,
              left: `${spotlight.x + spotlight.width}px`,
              width: `calc(100vw - ${spotlight.x + spotlight.width}px)`,
              height: `${spotlight.height}px`,
            }}
          />
        </>
      ) : (
        <div className="fixed inset-0 z-[100000]" />
      )}

      {/* Guide card — top-right */}
      <div className="fixed top-3 right-4 z-[100001] max-w-[340px] w-[calc(100vw-32px)]">
        <GuideCard
          stepIndex={stepIndex}
          totalSteps={totalSteps}
          stageIdx={stageIdx}
          totalStages={stages.length}
          title={currentStage.title}
          desc={currentStage.description}
          onNext={onNext}
          onSkip={onSkip}
          interactive={interactive}
        />
      </div>
    </>
  )
}
