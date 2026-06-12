import mongoose from 'mongoose'

const operationLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  userName: { type: String, required: true },
  target: { type: String, default: '' },
  detail: { type: String, default: '' },
  type: {
    type: String,
    enum: ['success', 'warning', 'pending', 'destructive'],
    default: 'success'
  }
}, {
  timestamps: true
})

export default mongoose.model('OperationLog', operationLogSchema)
