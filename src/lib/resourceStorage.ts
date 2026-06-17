// ─── Resource Application Storage (localStorage) ───

export interface ResourceApplication {
  id: string
  userId: string
  userName: string
  userPhone: string
  userDepartment: string
  resourceType: string
  reason: string
  status: "pending" | "allocated"
  allocatedInfo?: string
  allocatedDate?: string
  applyDate: string
}

const STORAGE_KEY = "boss-resource-apps"

function generateId(): string {
  return "app_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8)
}

export function loadApplications(): ResourceApplication[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveApplication(app: ResourceApplication) {
  const apps = loadApplications()
  apps.push(app)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps))
}

export function updateApplication(id: string, updates: Partial<ResourceApplication>) {
  const apps = loadApplications()
  const idx = apps.findIndex((a) => a.id === id)
  if (idx >= 0) {
    apps[idx] = { ...apps[idx], ...updates }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps))
  }
}
