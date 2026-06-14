import { useTutorial } from "../context/TutorialContext"
import { useAuth } from "../context/AuthContext"

const STEP_LABELS = ["注册", "学习", "考试", "申请", "兑换"]

/**
 * 新手引导教程 — 顶部进度条 + 步骤标签
 * 仅对未激活的 BOSS 用户显示
 */
export default function TutorialGuide() {
  const { progress, isActive, state } = useTutorial()
  const { user } = useAuth()

  if (!isActive) return null
  if (user?.role !== "boss") return null

  const currentStep = state.step

  return (
    <>
      {/* ── 顶部进度条 ── */}
      <div className="fixed top-0 left-0 right-0 z-[9999]">
        {/* 渐变条 */}
        <div className="h-1.5 bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 transition-all duration-700 ease-out shadow-sm"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* 步骤标签行 */}
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-amber-100 dark:border-amber-900/30">
          <div className="flex items-center justify-center gap-1.5 px-4 py-1.5">
            {STEP_LABELS.map((label, i) => {
              const isDone = i < currentStep
              const isCurrent = i === currentStep
              return (
                <div key={i} className="flex items-center gap-1">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium transition-all duration-300 ${
                      isDone
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : isCurrent
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 ring-1 ring-amber-400 shadow-sm"
                        : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                    }`}
                  >
                    {label}
                  </span>
                  {i < STEP_LABELS.length - 1 && (
                    <div
                      className={`h-px w-3 transition-all duration-300 ${
                        i < currentStep ? "bg-emerald-300" : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
