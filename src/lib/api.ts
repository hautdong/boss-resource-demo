const API_BASE = '/api'

let authToken: string | null = localStorage.getItem('boss-resource-token')

export function setToken(token: string | null) {
  authToken = token
  if (token) {
    localStorage.setItem('boss-resource-token', token)
  } else {
    localStorage.removeItem('boss-resource-token')
  }
}

export function getToken(): string | null {
  return authToken
}

async function request<T = any>(
  method: string,
  path: string,
  body?: any
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json()

  if (!res.ok) {
    if (res.status === 401) {
      // Token expired or invalid, clear it
      setToken(null)
    }
    throw new Error(data.error || '请求失败')
  }

  return data
}

// ── Auth API ──
export const authApi = {
  login: (username: string, password: string) =>
    request<{ message: string; token: string; user: any }>('POST', '/auth/login', { username, password }),

  register: (data: { name: string; username: string; phone: string; password: string }) =>
    request<{ message: string; token: string; user: any }>('POST', '/auth/register', data),

  me: () =>
    request<{ user: any }>('GET', '/auth/me'),

  updateProfile: (data: { name?: string; phone?: string }) =>
    request<{ message: string; user: any }>('PUT', '/auth/profile', data),

  updateActivation: (data: { status?: string; examScore?: number; examPassed?: boolean }) =>
    request<{ message: string; user: any }>('PUT', '/auth/activation', data),
}

// ── Users API ──
export const usersApi = {
  list: () =>
    request<{ users: any[] }>('GET', '/users'),

  stats: () =>
    request<{ stats: any }>('GET', '/users/stats'),

  updateRole: (id: string, role: string) =>
    request<{ message: string; user: any }>('PUT', `/users/${id}/role`, { role }),

  delete: (id: string) =>
    request<{ message: string }>('DELETE', `/users/${id}`),
}

// ── Resources API ──
export const resourcesApi = {
  pending: () =>
    request<{ items: any[] }>('GET', '/resources/pending'),

  approve: (id: string) =>
    request<{ message: string; item: any }>('PUT', `/resources/pending/${id}/approve`),

  reject: (id: string, note?: string) =>
    request<{ message: string; item: any }>('PUT', `/resources/pending/${id}/reject`, { note }),

  apply: (data: any) =>
    request<{ message: string; item: any }>('POST', '/resources/apply', data),

  allocated: () =>
    request<{ items: any[] }>('GET', '/resources/allocated'),

  costBudgets: () =>
    request<{ items: any[] }>('GET', '/resources/cost-budgets'),

  dashboard: () =>
    request<{ pendingApprovals: number; totalResources: number; totalBudget: number; totalUsed: number; budgetRemaining: number }>('GET', '/resources/dashboard'),
}

// ── Logs API ──
export const logsApi = {
  list: (params?: { limit?: number; offset?: number }) => {
    const qs = new URLSearchParams()
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.offset) qs.set('offset', String(params.offset))
    return request<{ items: any[]; total: number }>('GET', `/logs?${qs.toString()}`)
  },
}

// ── Bugs API ──
export const bugsApi = {
  list: () =>
    request<{ items: any[] }>('GET', '/bugs'),

  create: (data: { title: string; description: string; steps?: string; severity?: string }) =>
    request<{ message: string; item: any }>('POST', '/bugs', data),

  update: (id: string, data: { status?: string; assignee?: string }) =>
    request<{ message: string; item: any }>('PUT', `/bugs/${id}`, data),
}
