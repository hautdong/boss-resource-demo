import { Router } from 'express'
import ResourceApplication from '../models/ResourceApplication.js'
import AllocatedResource from '../models/AllocatedResource.js'
import CostBudget from '../models/CostBudget.js'
import OperationLog from '../models/OperationLog.js'
import { authMiddleware, adminOnly } from '../middleware/auth.js'

const router = Router()

// ── 资源审批 ──

/** GET /api/resources/pending - 获取待审批列表 */
router.get('/pending', authMiddleware, adminOnly, async (req, res) => {
  try {
    const items = await ResourceApplication.find({ status: '待审批' }).sort({ createdAt: -1 })
    res.json({ items })
  } catch (err) {
    res.status(500).json({ error: '获取待审批列表失败' })
  }
})

/** PUT /api/resources/pending/:id/approve - 通过审批 */
router.put('/pending/:id/approve', authMiddleware, adminOnly, async (req, res) => {
  try {
    const app = await ResourceApplication.findByIdAndUpdate(
      req.params.id,
      { status: '已通过', reviewerId: req.userId, reviewedAt: new Date() },
      { new: true }
    )
    if (!app) return res.status(404).json({ error: '申请不存在' })

    await OperationLog.create({
      action: '资源审批',
      userId: req.userId,
      userName: req.userName || '管理员',
      target: `通过了 ${app.applicant} 的 ${app.resource} 申请`,
      type: 'success'
    })

    res.json({ message: '已通过', item: app })
  } catch (err) {
    res.status(500).json({ error: '操作失败' })
  }
})

/** PUT /api/resources/pending/:id/reject - 驳回申请 */
router.put('/pending/:id/reject', authMiddleware, adminOnly, async (req, res) => {
  try {
    const app = await ResourceApplication.findByIdAndUpdate(
      req.params.id,
      { status: '已驳回', reviewerId: req.userId, reviewNote: req.body.note || '', reviewedAt: new Date() },
      { new: true }
    )
    if (!app) return res.status(404).json({ error: '申请不存在' })

    await OperationLog.create({
      action: '资源审批',
      userId: req.userId,
      userName: req.userName || '管理员',
      target: `驳回了 ${app.applicant} 的 ${app.resource} 申请`,
      type: 'destructive'
    })

    res.json({ message: '已驳回', item: app })
  } catch (err) {
    res.status(500).json({ error: '操作失败' })
  }
})

/** POST /api/resources/apply - 提交资源申请 */
router.post('/apply', authMiddleware, async (req, res) => {
  try {
    const { resource, amount, unit, cost, applyType, reason } = req.body

    const app = await ResourceApplication.create({
      applicantId: req.userId,
      applicant: req.body.applicant || req.userName || '用户',
      department: req.body.department || '成员BOSS',
      resource,
      amount,
      unit: unit || '条',
      cost: cost || 0,
      applyType: applyType || '定期',
      reason: reason || ''
    })

    await OperationLog.create({
      action: '资源申请',
      userId: req.userId,
      userName: req.body.applicant || '用户',
      target: `申请了 ${amount}${unit} ${resource}`,
      type: 'pending'
    })

    res.status(201).json({ message: '申请已提交', item: app })
  } catch (err) {
    res.status(500).json({ error: '提交失败' })
  }
})

// ── 已分配资源 ──

/** GET /api/resources/allocated - 获取已分配资源 */
router.get('/allocated', authMiddleware, async (req, res) => {
  try {
    const items = await AllocatedResource.find().sort({ createdAt: -1 })
    res.json({ items })
  } catch (err) {
    res.status(500).json({ error: '获取已分配资源失败' })
  }
})

// ── 成本台账 ──

/** GET /api/resources/cost-budgets - 获取成本预算 */
router.get('/cost-budgets', authMiddleware, async (req, res) => {
  try {
    const items = await CostBudget.find().sort({ category: 1 })
    res.json({ items })
  } catch (err) {
    res.status(500).json({ error: '获取成本台账失败' })
  }
})

/** GET /api/resources/dashboard - 仪表盘概览 */
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const pendingCount = await ResourceApplication.countDocuments({ status: '待审批' })
    const totalAllocated = await AllocatedResource.countDocuments()

    const budgets = await CostBudget.find()
    const totalBudget = budgets.reduce((s, b) => s + b.budget, 0)
    const totalUsed = budgets.reduce((s, b) => s + b.used, 0)

    res.json({
      pendingApprovals: pendingCount,
      totalResources: totalAllocated,
      totalBudget,
      totalUsed,
      budgetRemaining: totalBudget - totalUsed
    })
  } catch (err) {
    res.status(500).json({ error: '获取仪表盘数据失败' })
  }
})

export default router
