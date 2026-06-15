import { Router } from 'express'
import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import { authMiddleware } from '../middleware/auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, '..', 'data.db')

function getDb() {
  const db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
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
      createdAt TEXT DEFAULT (datetime('now','localtime'))
    )
  `)
  return db
}

const uuid = () => 'res-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8)
const router = Router()

// GET /api/boss-resources/pending-count
router.get('/pending-count', authMiddleware, async (req, res) => {
  try {
    const db = getDb()
    const row = db.prepare("SELECT COUNT(*) as c FROM boss_resources WHERE status = 'pending'").get()
    res.json({ count: row.c })
    db.close()
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// GET /api/boss-resources — 获取申请列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = getDb()
    const apps = db.prepare('SELECT * FROM boss_resources ORDER BY createdAt DESC').all()
    res.json(apps || [])
    db.close()
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// POST /api/boss-resources — 提交资源申请
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { resourceType, reason } = req.body
    const db = getDb()
    const id = uuid()
    db.prepare(
      `INSERT INTO boss_resources (id, userId, userName, resourceType, reason, status, createdAt) VALUES (?, ?, ?, ?, ?, 'pending', datetime('now','localtime'))`
    ).run(id, req.userId, req.userName || '用户', resourceType, reason || '')
    res.status(201).json({ id, message: '申请已提交' })
    db.close()
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// PUT /api/boss-resources/:id/allocate — 分配资源
router.put('/:id/allocate', authMiddleware, async (req, res) => {
  try {
    const { allocatedInfo } = req.body
    const db = getDb()
    const info = db.prepare('UPDATE boss_resources SET status = ?, allocatedInfo = ?, allocatedDate = datetime(\'now\',\'localtime\'), reviewerId = ? WHERE id = ?')
      .run('allocated', allocatedInfo, req.userId, req.params.id)
    res.json({ message: '分配成功', changes: info.changes })
    db.close()
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

export default router
