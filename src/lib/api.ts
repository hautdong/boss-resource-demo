const API_BASE = ""

const TOKEN_KEY = "boss-resource-token"

let token = localStorage.getItem(TOKEN_KEY) || ""

export function setToken(t: string | null) {
  if (t) {
    token = t
    localStorage.setItem(TOKEN_KEY, t)
  } else {
    token = ""
    localStorage.removeItem(TOKEN_KEY)
  }
}

export function clearToken() {
  token = ""
  localStorage.removeItem(TOKEN_KEY)
}

export function getToken() {
  return token
}

async function request(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    if (res.status === 401) {
      clearToken()
      window.location.href = "/login"
    }
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `请求失败 (${res.status})`)
  }
  return res.json()
}

// ── Auth ──
export const api = {
  auth: {
    login: (username: string, password: string) =>
      request("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
    register: (data: { username: string; password: string; name: string; phone?: string; department?: string; role?: string }) =>
      request("/api/auth/register", { method: "POST", body: JSON.stringify(data) }),
    me: () => request("/api/auth/me"),
    update: (data: any) => request("/api/auth/me", { method: "PUT", body: JSON.stringify(data) }),
  },

  points: {
    get: (userId: string) => request(`/api/points/${userId}`),
    add: (userId: string, amount: number, reason = "", source = "") =>
      request("/api/points", { method: "POST", body: JSON.stringify({ userId, amount, reason, source }) }),
    ranking: () => request("/api/points/ranking"),
    batchImport: (items: any[], fileName: string) =>
      request("/api/points/batch-import", { method: "POST", body: JSON.stringify({ items, fileName }) }),
    importHistory: () => request("/api/points/import-history"),
  },

  study: {
    get: (userId: string) => request(`/api/study/${userId}`),
    save: (userId: string, data: any) =>
      request(`/api/study/${userId}`, { method: "PUT", body: JSON.stringify(data) }),
  },

  exam: {
    submit: (score: number, passed: boolean) =>
      request("/api/exam/submit", { method: "POST", body: JSON.stringify({ score, passed }) }),
    cooldown: (userId: string) => request(`/api/exam/cooldown/${userId}`),
  },

  resources: {
    allocated: () => request("/api/resources/allocated"),
    my: (userId: string) => request(`/api/resources/my/${userId}`),
    allocate: (data: any) => request("/api/resources/allocate", { method: "POST", body: JSON.stringify(data) }),
    request: (data: any) => request("/api/resources/request", { method: "POST", body: JSON.stringify(data) }),
    approvals: () => request("/api/resources/approvals"),
    approve: (id: string, status: string) =>
      request(`/api/resources/approve/${id}`, { method: "PUT", body: JSON.stringify({ status }) }),
  },

  stats: {
    ranking: () => request("/api/statistics/ranking"),
    summary: () => request("/api/statistics/summary"),
  },

  admin: {
    users: () => request("/api/admin/users"),
    updateUser: (userId: string, data: { activationStatus?: string }) =>
      request(`/api/admin/users/${userId}`, { method: "PUT", body: JSON.stringify(data) }),
  },

  orders: {
    create: (data: { productId: string; productName: string; pointsCost: number; quantity: number }) =>
      request("/api/orders", { method: "POST", body: JSON.stringify(data) }),
    list: () => request("/api/orders"),
    ship: (id: string, shippedAccount: string) =>
      request(`/api/orders/${id}/ship`, { method: "PUT", body: JSON.stringify({ shippedAccount }) }),
    pendingCount: () => request("/api/orders/pending-count"),
  },

  bossResources: {
    apply: (data: { resourceType: string; reason: string }) =>
      request("/api/boss-resources/apply", { method: "POST", body: JSON.stringify(data) }),
    applications: () => request("/api/boss-resources/applications"),
    allocate: (id: string, allocatedInfo: string) =>
      request(`/api/boss-resources/${id}/allocate`, { method: "PUT", body: JSON.stringify({ allocatedInfo }) }),
    pendingCount: () => request("/api/boss-resources/pending-count"),
  },
}

// ── 兼容旧版导出 ──
export const authApi = {
  login: (username: string, password: string) =>
    api.auth.login(username, password),
  register: (data: any) =>
    api.auth.register(data),
  me: () =>
    api.auth.me(),
  updateActivation: (data: any) =>
    api.auth.update(data),
}
