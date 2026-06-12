import { Router } from 'express'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import OperationLog from '../models/OperationLog.js'
import { generateToken, authMiddleware } from '../middleware/auth.js'

const router = Router()

/** POST /api/auth/register - 注册新用户 */
router.post('/register', async (req, res) => {
  try {
    const { name, username, phone, password } = req.body

    if (!name || !username || !password) {
      return res.status(400).json({ error: '请填写所有必填字段' })
    }
    if (username.length < 2 || username.length > 20) {
      return res.status(400).json({ error: '用户名长度应为 2-20 个字符' })
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: '用户名仅支持字母、数字、下划线' })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度至少 6 位' })
    }

    const existing = await User.findOne({ username: username.toLowerCase() })
    if (existing) {
      return res.status(409).json({ error: '该用户名已被注册' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await User.create({
      name,
      username: username.toLowerCase(),
      phone: phone || '',
      password: hashedPassword,
      department: '成员BOSS',
      role: 'boss',
      roleLabel: '成员BOSS',
      level: 'L1',
      activationStatus: 'pending'
    })

    const token = generateToken(user._id, user.role)

    // 记录注册日志
    await OperationLog.create({
      action: '注册账号',
      userId: user._id,
      userName: user.name,
      target: `${user.name} 注册了新账号`,
      type: 'success'
    })

    res.status(201).json({
      message: '注册成功',
      token,
      user: user.toSafeObject()
    })
  } catch (err) {
    console.error('[Auth] 注册失败:', err)
    res.status(500).json({ error: '注册失败，系统异常' })
  }
})

/** POST /api/auth/login - 用户登录 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: '请输入用户名和密码' })
    }

    const user = await User.findOne({ username: username.toLowerCase() })
    if (!user) {
      return res.status(401).json({ error: '账号不存在，请检查用户名或注册新账号' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ error: '密码错误，请重试' })
    }

    const token = generateToken(user._id, user.role)

    // 记录登录日志
    await OperationLog.create({
      action: '登录系统',
      userId: user._id,
      userName: user.name,
      type: 'success'
    })

    res.json({
      message: '登录成功',
      token,
      user: user.toSafeObject()
    })
  } catch (err) {
    console.error('[Auth] 登录失败:', err)
    res.status(500).json({ error: '登录失败，系统异常' })
  }
})

/** GET /api/auth/me - 获取当前用户信息 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }
    res.json({ user: user.toSafeObject() })
  } catch (err) {
    res.status(500).json({ error: '获取用户信息失败' })
  }
})

/** PUT /api/auth/profile - 更新个人信息 */
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, phone } = req.body
    const update = {}
    if (name) update.name = name
    if (phone !== undefined) update.phone = phone

    const user = await User.findByIdAndUpdate(req.userId, update, { new: true })
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }

    res.json({ message: '更新成功', user: user.toSafeObject() })
  } catch (err) {
    res.status(500).json({ error: '更新失败' })
  }
})

/** PUT /api/auth/activation - 更新激活状态 */
router.put('/activation', authMiddleware, async (req, res) => {
  try {
    const { status, examScore, examPassed } = req.body
    const update = {}
    if (status) update.activationStatus = status
    if (examScore !== undefined) update.examScore = examScore
    if (examPassed !== undefined) update.examPassed = examPassed

    const user = await User.findByIdAndUpdate(req.userId, update, { new: true })
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }

    res.json({ message: '更新成功', user: user.toSafeObject() })
  } catch (err) {
    res.status(500).json({ error: '更新失败' })
  }
})

export default router
