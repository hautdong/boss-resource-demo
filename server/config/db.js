import mongoose from 'mongoose'

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/boss-resource'
  try {
    const conn = await mongoose.connect(uri)
    console.log(`[Database] MongoDB 已连接: ${conn.connection.host}`)
    return conn
  } catch (error) {
    console.error(`[Database] 连接失败: ${error.message}`)
    process.exit(1)
  }
}

export default connectDB
