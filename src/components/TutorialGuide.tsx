import { useTutorial } from "../context/TutorialContext"
import { useAuth } from "../context/AuthContext"

const STEP_LABELS = ["第一步学习资料", "第二步参加考试", "第三步申请BOSS资质", "第四步注册BOSS账号", "第五步完成新手教程"]

/**
 * 新手引导教程 — 顶部进度条 + 步骤标签（正常文档流，不遮挡页面内容）
 * 仅对未激活的 BOSS 用户显示
 */
export default function TutorialGuide() {
  const { isActive, state } = useTutorial()
  const { user } = useAuth()

  if (!isActive) return null
  if (user?.role !== "boss") return null

  const currentStep = state.step

  return (
    <div className="w-full shrink-0">
      {/* 步骤标签行 — 手机和桌面显示同样的5个标签，通过响应式字号间距自动适配 */}
      <div className="bg-white/95 dark:bg-gray-900/95 border-b border-indigo-100 dark:border-indigo-900/30">
        <div className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-1 sm:py-1.5 overflow-x-auto">
          {STEP_LABELS.map((label, i) => {
            const isDone = i < currentStep
            const isCurrent = i === currentStep
            return (
              <div key={i} className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                <span
                  className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium transition-all duration-300 whitespace-nowrap ${
                    isDone
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : isCurrent
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 ring-1 ring-indigo-400 shadow-sm"
                      : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                  }`}
                >
                  {label}
                </span>
                {i < STEP_LABELS.length - 1 && (
                  <div
                    className={`h-px w-1 sm:w-2.5 transition-all duration-300 shrink-0 ${
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
  )
}
