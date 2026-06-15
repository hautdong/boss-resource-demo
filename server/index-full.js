import express from "express"
import cors from "cors"
import jwt from "jsonwebtoken"
import { getDb } from "./db.js"

const app = express()
const PORT = 3001
const JWT_SECRET = "boss-resource-system-secret-key-2026"

app.use(cors())
app.use(express.json({ limit: '50mb' }))

// ── Auth middleware ──
function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ error: "未登录" })
  try {
    const token = header.replace("Bearer ", "")
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: "登录已过期" })
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== "super_admin" && req.user.role !== "admin") {
    return res.status(403).json({ error: "无权限" })
  }
  next()
}

// Init boss tables
;(function initBossTables() {
  const db = getDb()
  db.exec(`
    CREATE TABLE IF NOT EXISTS boss_resources (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      userName TEXT DEFAULT '',
      resourceType TEXT NOT NULL,
      reason TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      allocatedInfo TEXT DEFAULT NULL,
      allocatedDate TEXT DEFAULT NULL,
      reviewerId TEXT DEFAULT NULL,
      applyDate TEXT DEFAULT (datetime('now','localtime')),
      createdAt TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      userName TEXT DEFAULT '',
      productId TEXT NOT NULL,
      productName TEXT DEFAULT '',
      quantity INTEGER DEFAULT 1,
      points INTEGER DEFAULT 0,
      shippedAccount TEXT DEFAULT NULL,
      status TEXT DEFAULT 'pending',
      createdAt TEXT DEFAULT (datetime('now','localtime'))
    );
  `)
})()

// ═══════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════

app.post("/api/auth/register", (req, res) => {
  const { username, password, name, phone, department, role } = req.body
  if (!username || !password || !name) return res.status(400).json({ error: "缺少必填字段" })
  const db = getDb()
  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username)
  if (existing) return res.status(409).json({ error: "用户名已存在" })
  const id = `U${Date.now()}`
  const roleMap = { super_admin: { label: "超级管理员" }, admin: { label: "管理员" }, boss: { label: "成员BOSS" }, developer: { label: "开发者" } }
  const r = role || "boss"
  const roleLabel = roleMap[r]?.label || "成员BOSS"
  db.prepare(`INSERT INTO users (id, username, password, name, phone, department, role, roleLabel, joinDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now','localtime'))`)
    .run(id, username, password, name, phone || "", department || "", r, roleLabel)
  const token = jwt.sign({ id, username, name, role: r }, JWT_SECRET, { expiresIn: "7d" })
  res.json({ token, user: { id, username, name, phone: phone || "", department: department || "", role: r, roleLabel, activationStatus: "pending" } })
})

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: "请填写用户名和密码" })
  const db = getDb()
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username)
  if (!user || user.password !== password) return res.status(401).json({ error: "用户名或密码错误" })
  const token = jwt.sign({ id: user.id, username: user.username, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: "7d" })
  res.json({ token, user: { id: user.id, username: user.username, name: user.name, phone: user.phone, department: user.department, role: user.role, roleLabel: user.roleLabel, activationStatus: user.activationStatus, examScore: user.examScore, examPassed: !!user.examPassed } })
})

app.get("/api/auth/me", auth, (req, res) => {
  const db = getDb()
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id)
  if (!user) return res.status(404).json({ error: "用户不存在" })
  res.json({ id: user.id, username: user.username, name: user.name, phone: user.phone, department: user.department, role: user.role, roleLabel: user.roleLabel, activationStatus: user.activationStatus, examScore: user.examScore, examPassed: !!user.examPassed })
})

app.put("/api/auth/me", auth, (req, res) => {
  const { activationStatus, examScore, examPassed } = req.body
  const db = getDb()
  db.prepare("UPDATE users SET activationStatus = ?, examScore = ?, examPassed = ? WHERE id = ?")
    .run(activationStatus || "pending", examScore ?? null, examPassed ? 1 : 0, req.user.id)
  res.json({ success: true })
})

// ═══════════════════════════════════════════════
// ADMIN
// ═══════════════════════════════════════════════

app.get("/api/admin/users", auth, adminOnly, (req, res) => {
  const db = getDb()
  const users = db.prepare("SELECT id, username, name, phone, department, role, roleLabel, activationStatus, examScore, examPassed, joinDate FROM users ORDER BY joinDate DESC").all()
  const result = users.map((u) => {
    const rows = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM points WHERE userId = ?").get(u.id)
    return { ...u, points: rows.total, examPassed: !!u.examPassed, banned: false }
  })
  res.json(result)
})

app.put("/api/admin/users/:userId", auth, adminOnly, (req, res) => {
  const { activationStatus } = req.body
  const db = getDb()
  db.prepare("UPDATE users SET activationStatus = ? WHERE id = ?").run(activationStatus, req.params.userId)
  res.json({ success: true })
})

// ═══════════════════════════════════════════════
// POINTS
// ═══════════════════════════════════════════════

app.get("/api/points/:userId", auth, (req, res) => {
  const db = getDb()
  const rows = db.prepare("SELECT amount, reason, createdAt FROM points WHERE userId = ? ORDER BY id").all(req.params.userId)
  const total = rows.reduce((s, r) => s + r.amount, 0)
  res.json({ total, records: rows, firstPointsTime: rows.length > 0 ? rows[0].createdAt : null })
})

app.post("/api/points", auth, (req, res) => {
  const { userId, amount, reason, source } = req.body
  if (!userId || !amount) return res.status(400).json({ error: "缺少参数" })
  const db = getDb()
  db.prepare("INSERT INTO points (userId, amount, reason, source) VALUES (?, ?, ?, ?)").run(userId, amount, reason || "", source || "")
  const rows = db.prepare("SELECT amount FROM points WHERE userId = ?").all(userId)
  res.json({ total: rows.reduce((s, r) => s + r.amount, 0) })
})

app.get("/api/points/ranking", auth, (req, res) => {
  const db = getDb()
  const users = db.prepare("SELECT id, name, username, department, role, roleLabel FROM users WHERE role = 'boss'").all()
  const result = users.map((u) => {
    const rows = db.prepare("SELECT amount, id, createdAt FROM points WHERE userId = ? ORDER BY id").all(u.id)
    const total = rows.reduce((s, r) => s + r.amount, 0)
    return { ...u, points: total, lastPointsTime: rows.length > 0 ? rows[rows.length - 1].createdAt : null }
  })
  result.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (a.firstPointsTime && b.firstPointsTime) return new Date(a.firstPointsTime).getTime() - new Date(b.firstPointsTime).getTime()
    if (a.firstPointsTime) return -1
    if (b.firstPointsTime) return 1
    return 0
  })
  res.json(result)
})

// ═══════════════════════════════════════════════
// STUDY
// ═══════════════════════════════════════════════

app.get("/api/study/:userId", auth, (req, res) => {
  const db = getDb()
  res.json(db.prepare("SELECT * FROM study_progress WHERE userId = ?").all(req.params.userId))
})

app.put("/api/study/:userId", auth, (req, res) => {
  const { fileId, currentPage, readSeconds, completed } = req.body
  const db = getDb()
  const existing = db.prepare("SELECT id FROM study_progress WHERE userId = ? AND fileId = ?").get(req.params.userId, fileId)
  if (existing) {
    db.prepare("UPDATE study_progress SET currentPage = ?, readSeconds = ?, completed = ?, updatedAt = datetime('now','localtime') WHERE id = ?")
      .run(currentPage, readSeconds, completed ? 1 : 0, existing.id)
  } else {
    db.prepare("INSERT INTO study_progress (userId, fileId, currentPage, readSeconds, completed) VALUES (?, ?, ?, ?, ?)")
      .run(req.params.userId, fileId, currentPage || 1, readSeconds || 0, completed ? 1 : 0)
  }
  res.json({ success: true })
})

// ═══════════════════════════════════════════════
// EXAM
// ═══════════════════════════════════════════════

app.post("/api/exam/submit", auth, (req, res) => {
  const { score, passed } = req.body
  const db = getDb()
  db.prepare("INSERT INTO exam_attempts (userId, score, passed) VALUES (?, ?, ?)").run(req.user.id, score, passed ? 1 : 0)
  db.prepare("UPDATE users SET activationStatus = ?, examScore = ?, examPassed = ? WHERE id = ?")
    .run(passed ? "activated" : "pending", score, passed ? 1 : 0, req.user.id)
  if (passed) db.prepare("INSERT INTO points (userId, amount, reason, source) VALUES (?, 5, '考试通过奖励', 'activation')").run(req.user.id)
  res.json({ success: true })
})

app.get("/api/exam/cooldown/:userId", auth, (req, res) => {
  const db = getDb()
  const last = db.prepare("SELECT attemptedAt FROM exam_attempts WHERE userId = ? AND passed = 0 ORDER BY attemptedAt DESC LIMIT 1").get(req.params.userId)
  if (!last) return res.json({ cooldownLeft: 0 })
  const elapsed = Date.now() - new Date(last.attemptedAt).getTime()
  res.json({ cooldownLeft: Math.max(0, Math.ceil((3600000 - elapsed) / 1000)) })
})

// ═══════════════════════════════════════════════
// RESOURCES (legacy)
// ═══════════════════════════════════════════════

app.get("/api/resources/allocated", auth, (req, res) => {
  res.json(getDb().prepare("SELECT * FROM allocated_resources ORDER BY assignedAt DESC").all())
})

app.get("/api/resources/my/:userId", auth, (req, res) => {
  const db = getDb()
  const user = db.prepare("SELECT name FROM users WHERE id = ?").get(req.params.userId)
  if (!user) return res.json([])
  res.json(db.prepare("SELECT * FROM allocated_resources WHERE boss = ?").all(user.name))
})

app.post("/api/resources/allocate", auth, (req, res) => {
  const { boss, department, resource, amount, cost } = req.body
  const db = getDb()
  const id = `A${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const now = new Date().toISOString()
  const expiryAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
  db.prepare("INSERT INTO allocated_resources (id, boss, department, resource, amount, used, cost, assignedAt, expiryAt) VALUES (?, ?, ?, ?, ?, '0%', ?, ?, ?)")
    .run(id, boss, department, resource, amount, cost, now, expiryAt)
  res.json({ success: true, id })
})

app.post("/api/resources/request", auth, (req, res) => {
  const { applicant, department, items, total } = req.body
  const db = getDb()
  const id = `REQ-${Date.now()}`
  db.prepare("INSERT INTO resource_requests (id, applicant, department, items, total, date, status) VALUES (?, ?, ?, ?, ?, datetime('now','localtime'), '待审批')")
    .run(id, applicant, department, JSON.stringify(items), total)
  res.json({ success: true, id })
})

app.get("/api/resources/approvals", auth, (req, res) => {
  const rows = getDb().prepare("SELECT * FROM resource_requests ORDER BY date DESC").all()
  res.json(rows.map(r => ({ ...r, items: JSON.parse(r.items) })))
})

app.put("/api/resources/approve/:id", auth, (req, res) => {
  const { status } = req.body
  const db = getDb()
  const request = db.prepare("SELECT * FROM resource_requests WHERE id = ?").get(req.params.id)
  if (!request) return res.status(404).json({ error: "申请不存在" })
  db.prepare("UPDATE resource_requests SET status = ? WHERE id = ?").run(status, req.params.id)
  if (status === "已通过") {
    const items = JSON.parse(request.items)
    const now = new Date()
    for (const item of items) {
      const allocId = `A${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      db.prepare("INSERT INTO allocated_resources (id, boss, department, resource, amount, used, cost, assignedAt, expiryAt) VALUES (?, ?, ?, ?, ?, '0%', ?, ?, ?)")
        .run(allocId, request.applicant, request.department, item.name, String(item.quantity), `¥${item.subtotal.toLocaleString()}`, now.toISOString(), new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString())
    }
  }
  res.json({ success: true })
})

// ═══════════════════════════════════════════════
// BOSS RESOURCES (new) — 资源申请 + 分配 + 文件上传
// ═══════════════════════════════════════════════

app.get("/api/boss-resources/pending-count", auth, (req, res) => {
  const row = getDb().prepare("SELECT COUNT(*) as c FROM boss_resources WHERE status = 'pending'").get()
  res.json({ count: row.c })
})

app.get("/api/boss-resources/applications", auth, (req, res) => {
  const rows = getDb().prepare("SELECT * FROM boss_resources ORDER BY createdAt DESC").all()
  res.json(rows)
})

app.post("/api/boss-resources/apply", auth, (req, res) => {
  const { resourceType, reason } = req.body
  if (!resourceType) return res.status(400).json({ error: "请选择资源类型" })
  const db = getDb()
  const id = `BR-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  db.prepare("INSERT INTO boss_resources (id, userId, userName, resourceType, reason, status, applyDate, createdAt) VALUES (?, ?, ?, ?, ?, 'pending', datetime('now','localtime'), datetime('now','localtime'))")
    .run(id, req.user.id, req.user.name || req.user.username || '用户', resourceType, reason || '')
  res.status(201).json({ id, message: '申请已提交' })
})

app.put("/api/boss-resources/:id/allocate", auth, adminOnly, (req, res) => {
  const { allocatedInfo } = req.body
  if (!allocatedInfo) return res.status(400).json({ error: "请填写分配内容" })
  const db = getDb()
  db.prepare("UPDATE boss_resources SET status = 'allocated', allocatedInfo = ?, allocatedDate = datetime('now','localtime'), reviewerId = ? WHERE id = ?")
    .run(allocatedInfo, req.user.id, req.params.id)
  res.json({ message: '分配成功' })
})

// ═══════════════════════════════════════════════
// ORDERS — 姚币兑换订单
// ═══════════════════════════════════════════════

app.get("/api/orders/pending-count", auth, (req, res) => {
  const row = getDb().prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'pending'").get()
  res.json({ count: row.c })
})

app.get("/api/orders", auth, (req, res) => {
  res.json(getDb().prepare("SELECT * FROM orders ORDER BY createdAt DESC").all())
})

app.post("/api/orders", auth, (req, res) => {
  const { productId, productName, quantity, points } = req.body
  if (!productId) return res.status(400).json({ error: "缺少商品信息" })
  const db = getDb()
  const id = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  db.prepare("INSERT INTO orders (id, userId, userName, productId, productName, quantity, points, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now','localtime'))")
    .run(id, req.user.id, req.user.name || req.user.username || '用户', productId, productName || '', quantity || 1, points || 0)
  res.status(201).json({ id, message: '订单已创建' })
})

app.put("/api/orders/:id/ship", auth, adminOnly, (req, res) => {
  const { shippedAccount } = req.body
  if (!shippedAccount) return res.status(400).json({ error: "请填写发货账号" })
  getDb().prepare("UPDATE orders SET status = 'shipped', shippedAccount = ? WHERE id = ?").run(shippedAccount, req.params.id)
  res.json({ message: '发货成功' })
})

// ═══════════════════════════════════════════════
// STATISTICS
// ═══════════════════════════════════════════════

app.get("/api/statistics/ranking", auth, (req, res) => {
  const db = getDb()
  const users = db.prepare("SELECT id, name, username, phone, department, roleLabel FROM users WHERE role = 'boss'").all()
  const result = users.map((u) => {
    const rows = db.prepare("SELECT amount, createdAt FROM points WHERE userId = ? ORDER BY id").all(u.id)
    const total = rows.reduce((s, r) => s + r.amount, 0)
    return { ...u, points: total, lastPointsTime: rows.length > 0 ? rows[rows.length - 1].createdAt : null }
  })
  result.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (a.firstPointsTime && b.firstPointsTime) return new Date(a.firstPointsTime).getTime() - new Date(b.firstPointsTime).getTime()
    if (a.firstPointsTime) return -1
    if (b.firstPointsTime) return 1
    return 0
  })
  res.json(result)
})

app.get("/api/statistics/summary", auth, (req, res) => {
  const db = getDb()
  const bossCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'boss'").get().count
  const totalPoints = db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM points").get().total
  const avgPoints = bossCount > 0 ? (totalPoints / bossCount).toFixed(1) : "0"
  res.json({ totalBoss: bossCount, totalPoints, avgPoints })
})

// ═══════════════════════════════════════════════
// START
// ═══════════════════════════════════════════════

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ BOSS Resource API server running on port ${PORT}`)
})
