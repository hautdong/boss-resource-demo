import mongoose from 'mongoose'

const bugReportSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  steps: { type: String, default: '' },
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reporter: { type: String, required: true },
  severity: {
    type: String,
    enum: ['低', '中', '高', '紧急'],
    default: '中'
  },
  status: {
    type: String,
    enum: ['待处理', '处理中', '已修复', '已关闭'],
    default: '待处理'
  },
  assignee: { type: String, default: '' }
}, {
  timestamps: true
})

export default mongoose.model('BugReport', bugReportSchema)
