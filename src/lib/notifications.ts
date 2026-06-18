export interface Notification {
  id: string
  type: "ban" | "unban" | "points" | "resource"
  title: string
  message: string
  date: string
  read: boolean
  targetUser: string
  targetUserName?: string
  targetUserPhone?: string
}

export function loadNotifications(): Notification[] {
  try { return JSON.parse(localStorage.getItem("boss-notifications") || "[]") } catch { return [] }
}

export function saveNotifications(data: Notification[]) {
  localStorage.setItem("boss-notifications", JSON.stringify(data))
}

export function addNotification(notif: Omit<Notification, "id" | "date" | "read">) {
  const n: Notification = {
    ...notif,
    id: `NOTIF-${Date.now()}`,
    date: new Date().toLocaleDateString("zh-CN"),
    read: false,
  }
  const list = loadNotifications()
  saveNotifications([n, ...list])
  return n
}

export function markAllRead() {
  const list = loadNotifications().map((n) => ({ ...n, read: true }))
  saveNotifications(list)
}

export function getUnreadCount(): number {
  return loadNotifications().filter((n) => !n.read).length
}
