import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  phone: { type: String, default: '', trim: true },
  password: { type: String, required: true },
  department: { type: String, default: '成员BOSS' },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'boss'],
    default: 'boss'
  },
  roleLabel: { type: String, default: '成员BOSS' },
  level: { type: String, default: 'L1' },
  activationStatus: {
    type: String,
    enum: ['pending', 'studying', 'ready', 'activated'],
    default: 'pending'
  },
  examScore: { type: Number, default: null },
  examPassed: { type: Boolean, default: null },
  isPreset: { type: Boolean, default: false }
}, {
  timestamps: true
})

userSchema.methods.toSafeObject = function () {
  return {
    id: this._id.toString(),
    name: this.name,
    username: this.username,
    phone: this.phone,
    department: this.department,
    role: this.role,
    roleLabel: this.roleLabel,
    level: this.level,
    activationStatus: this.activationStatus,
    examScore: this.examScore,
    examPassed: this.examPassed,
    createdAt: this.createdAt
  }
}

export default mongoose.model('User', userSchema)
