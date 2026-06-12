import { Router } from 'express'
import OperationLog from '../models/OperationLog.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

/** GET /api/logs - 获取操作日志 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query
    const items = await OperationLog.find()
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit))

    const total = await OperationLog.countDocuments()

    res.json({ items, total })
  } catch (err) {
    res.status(500).json({ error: '获取日志失败' })
  }
})

export default router
