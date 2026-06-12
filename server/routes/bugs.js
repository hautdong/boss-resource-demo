import { Router } from 'express'
import BugReport from '../models/BugReport.js'
import OperationLog from '../models/OperationLog.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

/** GET /api/bugs - 获取所有反馈 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const items = await BugReport.find().sort({ createdAt: -1 })
    res.json({ items })
  } catch (err) {
    res.status(500).json({ error: '获取反馈列表失败' })
  }
})

/** POST /api/bugs - 提交反馈 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, steps, severity } = req.body
    if (!title || !description) {
      return res.status(400).json({ error: '标题和描述不能为空' })
    }

    const bug = await BugReport.create({
      title,
      description,
      steps: steps || '',
      reporterId: req.userId,
      reporter: req.body.reporter || '用户',
      severity: severity || '中'
    })

    await OperationLog.create({
      action: '提交反馈',
      userId: req.userId,
      userName: req.body.reporter || '用户',
      target: `提交了反馈: ${title}`,
      type: 'pending'
    })

    res.status(201).json({ message: '反馈已提交', item: bug })
  } catch (err) {
    res.status(500).json({ error: '提交失败' })
  }
})

/** PUT /api/bugs/:id - 更新反馈状态 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { status, assignee } = req.body
    const update = {}
    if (status) update.status = status
    if (assignee !== undefined) update.assignee = assignee

    const bug = await BugReport.findByIdAndUpdate(req.params.id, update, { new: true })
    if (!bug) return res.status(404).json({ error: '反馈不存在' })

    res.json({ message: '更新成功', item: bug })
  } catch (err) {
    res.status(500).json({ error: '更新失败' })
  }
})

export default router
