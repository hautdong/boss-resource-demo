import Database from "better-sqlite3"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, "data.db")

let db

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma("journal_mode = WAL")
    db.pragma("foreign_keys = ON")
    initSchema()
  }
  return db
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      department TEXT DEFAULT '',
      role TEXT NOT NULL DEFAULT 'boss',
      roleLabel TEXT DEFAULT '成员BOSS',
      activationStatus TEXT DEFAULT 'pending',
      examScore INTEGER DEFAULT NULL,
      examPassed INTEGER DEFAULT NULL,
      joinDate TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      amount INTEGER NOT NULL,
      reason TEXT DEFAULT '',
      source TEXT DEFAULT '',
      createdAt TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS study_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      fileId TEXT NOT NULL,
      currentPage INTEGER DEFAULT 1,
      readSeconds INTEGER DEFAULT 0,
      completed INTEGER DEFAULT 0,
      updatedAt TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS exam_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      score INTEGER NOT NULL,
      passed INTEGER NOT NULL DEFAULT 0,
      attemptedAt TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS allocated_resources (
      id TEXT PRIMARY KEY,
      userId TEXT,
      boss TEXT NOT NULL,
      department TEXT DEFAULT '',
      resource TEXT NOT NULL,
      amount TEXT DEFAULT '1/1',
      used TEXT DEFAULT '0%',
      cost TEXT DEFAULT '¥0',
      assignedAt TEXT DEFAULT (datetime('now','localtime')),
      expiryAt TEXT,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS resource_requests (
      id TEXT PRIMARY KEY,
      applicant TEXT NOT NULL,
      department TEXT DEFAULT '',
      items TEXT DEFAULT '[]',
      total REAL DEFAULT 0,
      date TEXT DEFAULT (datetime('now','localtime')),
      status TEXT DEFAULT '待审批'
    );

    CREATE TABLE IF NOT EXISTS approval_records (
      id TEXT PRIMARY KEY,
      applicant TEXT NOT NULL,
      department TEXT DEFAULT '',
      items TEXT DEFAULT '[]',
      total REAL DEFAULT 0,
      date TEXT DEFAULT (datetime('now','localtime')),
      status TEXT DEFAULT '待审批'
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      title TEXT NOT NULL,
      message TEXT DEFAULT '',
      read INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS points_imports (
      id TEXT PRIMARY KEY,
      fileName TEXT DEFAULT '',
      totalRows INTEGER DEFAULT 0,
      matchedRows INTEGER DEFAULT 0,
      totalPoints INTEGER DEFAULT 0,
      importedBy TEXT DEFAULT '',
      createdAt TEXT DEFAULT (datetime('now','localtime'))
    );
  `)
}
