import mongoose from 'mongoose'

const resourceApplicationSchema = new mongoose.Schema({
  applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  applicant: { type: String, required: true },
  department: { type: String, required: true },
  resource: {
    type: String,
    enum: ['打招呼数', '回复数', '线索包', '其他'],
    required: true
  },
  amount: { type: Number, required: true },
  unit: { type: String, default: '条' },
  cost: { type: Number, required: true },
  applyType: {
    type: String,
    enum: ['定期', '临时'],
    default: '定期'
  },
  reason: { type: String, default: '' },
  status: {
    type: String,
    enum: ['待审批', '已通过', '已驳回'],
    default: '待审批'
  },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewNote: { type: String, default: '' },
  reviewedAt: { type: Date, default: null }
}, {
  timestamps: true
})

export default mongoose.model('ResourceApplication', resourceApplicationSchema)
