# 🏢 姚司机 BOSS 资源管理系统

BOSS 资源分配管理系统 — 资源申请 · 智能审批 · 成本管控 · 数据洞察

## 🚀 技术栈

| 层 | 技术 |
|---|---|
| **前端** | React 18 + TypeScript + Vite + TailwindCSS |
| **后端** | Node.js + Express |
| **数据库** | MongoDB (Mongoose) |
| **认证** | JWT (JSON Web Token) |

## 📦 本地开发

### 1. 克隆并安装依赖

```bash
git clone git@github.com:hautdong/boss-resource-demo.git
cd boss-resource-demo
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的 MongoDB 连接字符串：

```
MONGODB_URI=mongodb+srv://<用户名>:<密码>@<集群地址>/boss-resource?retryWrites=true&w=majority
JWT_SECRET=你的随机密钥
PORT=3001
```

### 3. 填充种子数据

```bash
npm run seed
```

### 4. 启动开发服务

```bash
# 同时启动前端和后端
npm run dev:all

# 或分别启动
npm run dev:server   # 后端 → http://localhost:3001
npm run dev          # 前端 → http://localhost:5173
```

### 5. 预设账号

| 角色 | 用户名 | 密码 | 姓名 |
|------|--------|------|------|
| 超级管理员 | `lll` | `admin123` | 林伶俐 |
| 管理员 | `ljc` | `admin123` | 林锦超 |
| 成员 BOSS | `hwf` | `13141314` | 黄文凤 |

## ☁️ 部署指南

### 方案一：Render.com（推荐，免费）

1. **注册** [Render.com](https://render.com)（GitHub 登录）
2. **创建 MongoDB Atlas 免费集群**（[MongoDB Atlas](https://www.mongodb.com/cloud/atlas)）
3. **在 Render Dashboard 中：**
   - New → Web Service → 连接你的 GitHub 仓库
   - Build Command: `npm install && npm run build`
   - Start Command: `node server/index.js`
   - 添加环境变量：
     - `MONGODB_URI` → 你的 MongoDB Atlas 连接串
     - `JWT_SECRET` → 随机密钥
     - `NODE_ENV` → `production`
4. **部署完成后**，Render 会给你一个 `https://yourapp.onrender.com` 的地址

### 方案二：Vercel + Render

- **前端**：部署到 Vercel（Build: `npm run build`, Output: `dist`）
- **后端**：部署到 Render（同上）
- 记得在前端环境变量中配置 API 地址

### 重要提示

- ⚠️ 首次部署后，需要运行 `npm run seed` 填充预设用户数据
- Render 免费实例会在 15 分钟无访问后休眠，再次访问会延迟几秒启动
- 建议在 MongoDB Atlas 中将 IP 白名单设为 `0.0.0.0/0`（允许所有 IP）

## 📁 项目结构

```
boss-resource-demo/
├── server/                  # 后端
│   ├── index.js            # Express 入口
│   ├── config/db.js        # MongoDB 连接
│   ├── models/             # 数据模型
│   ├── routes/             # API 路由
│   ├── middleware/         # 中间件
│   └── seed.js             # 种子数据
├── src/                    # 前端
│   ├── components/         # UI 组件
│   ├── context/            # React Context
│   ├── lib/                # 工具库
│   ├── pages/              # 页面
│   └── data/               # 数据
├── render.yaml             # Render 部署配置
├── Procfile                # Render 启动命令
├── .env.example            # 环境变量模板
└── README.md               # 本文件
```
