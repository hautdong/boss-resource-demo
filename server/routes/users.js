import { Router } from 'express'
import User from '../models/User.js'
import OperationLog from '../models/OperationLog.js'
import { authMiddleware, adminOnly } from '../middleware/auth.js'

const router = Router()

/** GET /api/users - 获取所有用户（管理员） */
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 })
    res.json({ users: users.map(u => u.toSafeObject()) })
  } catch (err) {
    res.status(500).json({ error: '获取用户列表失败' })
  }
})

/** GET /api/users/stats - 用户统计数据 */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const total = await User.countDocuments()
    const activated = await User.countDocuments({ activationStatus: 'activated' })
    const pending = await User.countDocuments({ activationStatus: 'pending' })
    const admins = await User.countDocuments({ role: { $in: ['super_admin', 'admin'] } })
    const bosses = await User.countDocuments({ role: 'boss' })

    res.json({
      stats: { total, activated, pending, admins, bosses }
    })
  } catch (err) {
    res.status(500).json({ error: '获取统计数据失败' })
  }
})

/** PUT /api/users/:id/role - 更新用户角色（管理员） */
router.put('/:id/role', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { role } = req.body
    const roleLabels = {
      super_admin: '超级管理员',
      admin: '管理员',
      boss: '成员BOSS'
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role, roleLabel: roleLabels[role] || '成员BOSS' },
      { new: true }
    )

    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }

    await OperationLog.create({
      action: '变更角色',
      userId: req.userId,
      userName: req.userName || '管理员',
      target: `将 ${user.name} 的角色变更为 ${roleLabels[role]}`,
      type: 'success'
    })

    res.json({ message: '角色更新成功', user: user.toSafeObject() })
  } catch (err) {
    res.status(500).json({ error: '更新失败' })
  }
})

/** DELETE /api/users/:id - 删除用户（管理员） */
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }
    if (user.isPreset) {
      return res.status(403).json({ error: '预设账号不可删除' })
    }

    await User.findByIdAndDelete(req.params.id)

    await OperationLog.create({
      action: '删除用户',
      userId: req.userId,
      userName: req.userName || '管理员',
      target: `删除了用户 ${user.name}`,
      type: 'destructive'
    })

    res.json({ message: '用户已删除' })
  } catch (err) {
    res.status(500).json({ error: '删除失败' })
  }
})

export default router
