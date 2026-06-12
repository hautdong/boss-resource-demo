import 'dotenv/config'
import bcrypt from 'bcryptjs'
import connectDB from './config/db.js'
import User from './models/User.js'
import ResourceApplication from './models/ResourceApplication.js'
import AllocatedResource from './models/AllocatedResource.js'
import CostBudget from './models/CostBudget.js'
import OperationLog from './models/OperationLog.js'
import BugReport from './models/BugReport.js'

async function seed() {
  console.log('🌱 开始填充数据库...')
  await connectDB()

  // 1. 清空数据
  await Promise.all([
    User.deleteMany({ isPreset: false }),
    ResourceApplication.deleteMany({}),
    AllocatedResource.deleteMany({}),
    CostBudget.deleteMany({}),
    OperationLog.deleteMany({}),
    BugReport.deleteMany({})
  ])
  console.log('  已清空旧数据')

  // 2. 预设用户
  const hashedAdmin = await bcrypt.hash('admin123', 10)
  const hashedHwf = await bcrypt.hash('13141314', 10)

  const presetUsers = [
    {
      name: '林伶俐',
      username: 'lll',
      phone: '',
      password: hashedAdmin,
      department: '总部',
      role: 'super_admin',
      roleLabel: '超级管理员',
      level: 'L3',
      activationStatus: 'activated',
      isPreset: true
    },
    {
      name: '林锦超',
      username: 'ljc',
      phone: '',
      password: hashedAdmin,
      department: '总部',
      role: 'admin',
      roleLabel: '管理员',
      level: 'L2',
      activationStatus: 'activated',
      isPreset: true
    },
    {
      name: '黄文凤',
      username: 'hwf',
      phone: '',
      password: hashedHwf,
      department: '成员BOSS',
      role: 'boss',
      roleLabel: '成员BOSS',
      level: 'L1',
      activationStatus: 'activated',
      isPreset: true
    }
  ]

  const createdUsers = await User.insertMany(presetUsers)
  console.log(`  ✅ 已创建 ${createdUsers.length} 个预设用户`)

  // 3. 预设资源申请
  const applications = [
    { applicantId: createdUsers[2]._id, applicant: '黄文凤', department: '成员BOSS', resource: '打招呼数', amount: 5000, unit: '条', cost: 2500, applyType: '定期', status: '待审批' },
    { applicantId: createdUsers[2]._id, applicant: '赵六', department: '华东事业部', resource: '打招呼数', amount: 5000, unit: '条', cost: 2500, applyType: '定期', status: '待审批' },
    { applicantId: createdUsers[2]._id, applicant: '孙七', department: '华北事业部', resource: '线索包', amount: 2000, unit: '条', cost: 8000, applyType: '临时', status: '待审批' },
    { applicantId: createdUsers[2]._id, applicant: '吴九', department: '西部事业部', resource: '回复数', amount: 10000, unit: '条', cost: 5000, applyType: '定期', status: '待审批' },
    { applicantId: createdUsers[2]._id, applicant: '周八', department: '华中事业部', resource: '打招呼数', amount: 3000, unit: '条', cost: 1500, applyType: '临时', status: '待审批' }
  ]
  await ResourceApplication.insertMany(applications)
  console.log(`  ✅ 已创建 ${applications.length} 个资源申请`)

  // 4. 已分配资源
  const now = new Date()
  const allocated = [
    { bossId: createdUsers[2]._id, boss: '赵六', department: '华东事业部', resource: '打招呼数', total: 20000, used: 15000, unit: '条', cost: 10000, expiry: new Date('2025-07-15') },
    { bossId: createdUsers[2]._id, boss: '孙七', department: '华北事业部', resource: '线索包', total: 5000, used: 800, unit: '条', cost: 20000, expiry: new Date('2025-08-01') },
    { bossId: createdUsers[2]._id, boss: '吴九', department: '西部事业部', resource: '回复数', total: 10000, used: 3200, unit: '条', cost: 5000, expiry: new Date('2025-07-20') },
    { bossId: createdUsers[2]._id, boss: '郑十', department: '华南事业部', resource: '打招呼数', total: 15000, used: 5000, unit: '条', cost: 7500, expiry: new Date('2025-08-10') },
    { bossId: createdUsers[2]._id, boss: '陈十一', department: '华东事业部', resource: '线索包', total: 3000, used: 200, unit: '条', cost: 12000, expiry: new Date('2025-07-25') }
  ]
  await AllocatedResource.insertMany(allocated)
  console.log(`  ✅ 已创建 ${allocated.length} 个已分配资源`)

  // 5. 成本预算
  const budgets = [
    { category: '打招呼资源', budget: 200000, used: 145000 },
    { category: '线索包资源', budget: 150000, used: 120000 },
    { category: '回复数资源', budget: 100000, used: 65000 },
    { category: '其他资源', budget: 50000, used: 55000 }
  ]
  await CostBudget.insertMany(budgets)
  console.log(`  ✅ 已创建 ${budgets.length} 个成本预算项`)

  // 6. 操作日志
  const logs = [
    { action: '资源分配', userId: createdUsers[0]._id, userName: '张明', target: '华东区 BOSS 账号', type: 'success' },
    { action: '账号激活', userId: createdUsers[1]._id, userName: '李华', target: '考试成绩达标通过', type: 'success' },
    { action: '成本预警', userId: createdUsers[0]._id, userName: '系统', target: '预算剩余不足 10%', type: 'warning' },
    { action: '资源申请', userId: createdUsers[2]._id, userName: '王五', target: '申请额外线索包 5000 条', type: 'pending' },
    { action: '账号冻结', userId: createdUsers[0]._id, userName: '赵六', target: '连续 30 天未登录', type: 'destructive' }
  ]
  // Adjust timestamps so they look like they happened over time
  const now2 = new Date()
  const logEntries = logs.map((log, i) => ({
    ...log,
    createdAt: new Date(now2.getTime() - (i + 1) * 3600000),
    updatedAt: new Date(now2.getTime() - (i + 1) * 3600000)
  }))
  await OperationLog.insertMany(logEntries)
  console.log(`  ✅ 已创建 ${logEntries.length} 条操作日志`)

  console.log('\n🎉 数据库填充完成！')
  console.log('\n📋 预设账号：')
  console.log('  超管: lll / admin123    (林伶俐)')
  console.log('  管理: ljc / admin123    (林锦超)')
  console.log('  成员: hwf / 13141314    (黄文凤)')
  console.log('\n💡 启动服务: npm run dev:server')
  console.log('💡 开发模式: npm run dev:all\n')

  process.exit(0)
}

seed().catch(err => {
  console.error('❌ 填充失败:', err)
  process.exit(1)
})
