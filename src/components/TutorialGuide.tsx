import { useNavigate, useLocation } from "react-router-dom"
import { useTutorial } from "../context/TutorialContext"

/**
 * 新手引导教程 — 进度条 + 浮动引导卡片
 * 始终在页面顶部渲染，不遮挡操作
 */
export default function TutorialGuide() {
  const { stepInfo, progress, next, skip, isActive } = useTutorial()
  const navigate = useNavigate()
  const location = useLocation()

  if (!isActive || !stepInfo) return null

  const step = TUTORIAL_STEPS_DATA[stepInfo.id]
  const isOnTarget = step?.path && location.pathname === step.path

  return (
    <>
      {/* ── 顶部进度条 ── */}
      <div className="fixed top-0 left-0 right-0 z-[9999] h-2 bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-100 dark:from-amber-900/30 dark:via-yellow-900/30 dark:to-amber-900/30 shadow-sm">
        <div
          className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 transition-all duration-700 ease-out shadow-lg"
          style={{ width: `${progress}%` }}
        />
        {/* 步骤标记 */}
        <div className="absolute top-3 left-0 right-0 flex justify-center gap-1 px-4">
          {["注册", "学习", "考试", "申请", "兑换"].map((label, i) => {
            const done = progress >= (i + 1) * 20
            return (
              <div key={i} className="flex items-center gap-1">
                <div className={`h-1.5 rounded-full transition-all duration-500 ${done ? "bg-emerald-400 w-6" : "bg-gray-300 dark:bg-gray-600 w-3"}`} />
                <span className={`text-[9px] ${done ? "text-emerald-600 font-medium" : "text-gray-400"}`}>{label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── 浮动引导卡片 ── */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] max-w-sm w-[92vw]">
        <div className="relative rounded-xl border-2 border-amber-300/60 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-300 to-yellow-400" />

          <div className="p-4">
            <div className="flex items-start gap-3 mb-2">
              {/* 金手指图标 */}
              <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-yellow-500 shadow-lg">
                <GoldenFinger className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">{stepInfo.title}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{stepInfo.desc}</p>
              </div>
            </div>

            {/* 步骤点 */}
            <div className="flex items-center gap-1.5 mb-3">
              {["register","study","exam","apply","exchange"].map((id, i) => {
                const currentStepIdx = ["register","study","exam","apply","exchange"].indexOf(stepInfo.id)
                const active = i === currentStepIdx
                const done = i < currentStepIdx
                return (
                  <div key={id} className="flex-1 h-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${done ? "bg-emerald-400 w-full" : active ? "bg-amber-400 w-2/3 animate-pulse" : "w-0"}`} />
                  </div>
                )
              })}
            </div>

            {/* 按钮 */}
            <div className="flex items-center justify-between">
              <button onClick={skip} className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                跳过教程
              </button>

              {!isOnTarget && step?.path ? (
                <button
                  onClick={() => navigate(step.path)}
                  className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-4 py-1.5 text-xs font-medium shadow-md hover:from-amber-600 hover:to-yellow-600 transition-all"
                >
                  {step.btn || "前往"} →
                </button>
              ) : (
                <button
                  onClick={next}
                  className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-4 py-1.5 text-xs font-medium shadow-md hover:from-amber-600 hover:to-yellow-600 transition-all"
                >
                  下一步 →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const TUTORIAL_STEPS_DATA: Record<string, { path?: string; btn?: string }> = {
  register: {},
  study: { path: "/activation", btn: "去学习" },
  exam: { path: "/activation", btn: "去考试" },
  apply: { path: "/resources", btn: "去申请" },
  exchange: { path: "/resources", btn: "去兑换" },
}

function GoldenFinger({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M7 11.5C7 10.12 8.12 9 9.5 9C9.67 9 9.83 9.03 10 9.08V5.5C10 4.67 10.67 4 11.5 4C12.33 4 13 4.67 13 5.5V8.5C13 8.5 14 7.5 15.5 7.5C16.33 7.5 17 8.17 17 9V12.5L17 14.5C17 17.54 14.54 20 11.5 20C9.5 20 7.79 18.72 7.09 16.95C6.92 16.54 6.77 16.12 6.64 15.69L5.94 13.58C5.67 12.73 6.04 11.83 6.87 11.52C6.96 11.48 7.05 11.46 7.14 11.45C7.05 11.31 7 11.14 7 11Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
