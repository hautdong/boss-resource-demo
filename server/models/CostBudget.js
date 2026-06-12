import mongoose from 'mongoose'

const costBudgetSchema = new mongoose.Schema({
  category: { type: String, required: true, unique: true },
  budget: { type: Number, required: true },
  used: { type: Number, default: 0 }
}, {
  timestamps: true
})

costBudgetSchema.virtual('remaining').get(function () {
  return this.budget - this.used
})

costBudgetSchema.virtual('usagePercent').get(function () {
  if (this.budget === 0) return 0
  return Math.round((this.used / this.budget) * 1000) / 10
})

costBudgetSchema.set('toJSON', { virtuals: true })
costBudgetSchema.set('toObject', { virtuals: true })

export default mongoose.model('CostBudget', costBudgetSchema)
