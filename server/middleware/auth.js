import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'boss-resource-jwt-secret-change-in-production'

/** 生成 JWT Token */
export function generateToken(userId, role) {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' })
}

/** 验证 JWT Token 中间件 */
export function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录，请先登录' })
  }

  try {
    const token = header.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.userId
    req.userRole = decoded.role
    next()
  } catch {
    return res.status(401).json({ error: '登录已过期，请重新登录' })
  }
}

/** 管理员权限中间件 */
export function adminOnly(req, res, next) {
  if (req.userRole !== 'super_admin' && req.userRole !== 'admin') {
    return res.status(403).json({ error: '权限不足，仅管理员可操作' })
  }
  next()
}

/** 超管权限中间件 */
export function superAdminOnly(req, res, next) {
  if (req.userRole !== 'super_admin') {
    return res.status(403).json({ error: '权限不足，仅超级管理员可操作' })
  }
  next()
}
