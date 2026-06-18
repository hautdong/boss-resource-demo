import { useTutorial } from "../context/TutorialContext"
import { useAuth } from "../context/AuthContext"

const STEPS = [
  { prefix: "第一步", title: "学习资料" },
  { prefix: "第二步", title: "参加考试" },
  { prefix: "第三步", title: "申请BOSS资质" },
  { prefix: "第四步", title: "注册BOSS账号" },
  { prefix: "第五步", title: "完成新手教程" },
]

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
      {/* 步骤标签行 — 两行居中布局 */}
      <div className="bg-white/95 dark:bg-gray-900/95 border-b border-indigo-100 dark:border-indigo-900/30">
        <div className="flex items-center justify-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 sm:py-2.5 overflow-x-auto">
          {STEPS.map((step, i) => {
            const isDone = i < currentStep
            const isCurrent = i === currentStep
            return (
              <div key={i} className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <div
                  className={`flex flex-col items-center justify-center px-2.5 sm:px-3 py-1.5 rounded-xl text-center transition-all duration-300 ${
                    isDone
                      ? "bg-emerald-100 dark:bg-emerald-900/30"
                      : isCurrent
                      ? "bg-indigo-100 dark:bg-indigo-900/30 ring-1 ring-indigo-400 shadow-sm"
                      : "bg-gray-100 dark:bg-gray-800"
                  }`}
                >
                  <span className={`text-[10px] sm:text-xs font-medium leading-tight ${
                    isDone
                      ? "text-emerald-600 dark:text-emerald-400"
                      : isCurrent
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-gray-400 dark:text-gray-500"
                  }`}>
                    {step.prefix}
                  </span>
                  <span className={`text-xs sm:text-sm font-semibold leading-tight mt-0.5 ${
                    isDone
                      ? "text-emerald-700 dark:text-emerald-300"
                      : isCurrent
                      ? "text-indigo-700 dark:text-indigo-300"
                      : "text-gray-500 dark:text-gray-400"
                  }`}>
                    {step.title}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-8 w-px sm:w-0.5 transition-all duration-300 shrink-0 ${
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
