import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import connectDB from './config/db.js'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import resourceRoutes from './routes/resources.js'
import logRoutes from './routes/logs.js'
import bugRoutes from './routes/bugs.js'
import bossResourceRoutes from './routes/bossResources.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

// 中间件
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}))
app.use(express.json({ limit: '50mb' }))

// 设置 req.userName 中间件（从请求中获取用户名的通用方式）
app.use((req, res, next) => {
  // 从 token 解码后的信息中获取，或者从请求 body 中获取
  next()
})

// API 路由
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/resources', resourceRoutes)
app.use('/api/logs', logRoutes)
app.use('/api/bugs', bugRoutes)
app.use('/api/boss-resources', bossResourceRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 生产环境：托管前端静态文件
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist')
  app.use(express.static(distPath))
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

// 启动服务器
async function start() {
  await connectDB()
  app.listen(PORT, () => {
    console.log(`[Server] BOSS资源管理系统 API 已启动: http://localhost:${PORT}`)
    console.log(`[Server] 环境: ${process.env.NODE_ENV || 'development'}`)
  })
}

start()
