import mongoose from 'mongoose'

const allocatedResourceSchema = new mongoose.Schema({
  bossId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  boss: { type: String, required: true },
  department: { type: String, required: true },
  resource: {
    type: String,
    enum: ['打招呼数', '回复数', '线索包', '其他'],
    required: true
  },
  total: { type: Number, required: true },
  used: { type: Number, default: 0 },
  unit: { type: String, default: '条' },
  cost: { type: Number, required: true },
  expiry: { type: Date, required: true }
}, {
  timestamps: true
})

allocatedResourceSchema.virtual('usagePercent').get(function () {
  if (this.total === 0) return 0
  return Math.round((this.used / this.total) * 1000) / 10
})

allocatedResourceSchema.set('toJSON', { virtuals: true })
allocatedResourceSchema.set('toObject', { virtuals: true })

export default mongoose.model('AllocatedResource', allocatedResourceSchema)
