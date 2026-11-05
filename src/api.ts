/**
 * API Service Layer for Clarity Platform
 * Connects frontend to the backend server (default: http://localhost:3001)
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Helper fetch wrapper
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(errorData.error || `API error: ${res.status}`)
  }

  return res.json()
}

export const api = {
  // Check if backend is reachable
  async checkHealth(): Promise<boolean> {
    try {
      const data = await apiFetch<{ status: string }>('/health')
      return data.status === 'ok'
    } catch {
      return false
    }
  },

  // Projects
  projects: {
    list: () => apiFetch<any[]>('/projects'),
    get: (id: string) => apiFetch<any>(`/projects/${id}`),
    create: (data: any) => apiFetch<any>('/projects', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, patch: any) =>
      apiFetch<any>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
    delete: (id: string) => apiFetch<any>(`/projects/${id}`, { method: 'DELETE' }),
    regenerateLink: (id: string) =>
      apiFetch<{ success: boolean; share_token: string }>(`/projects/${id}/link/regenerate`, { method: 'POST' }),
    toggleLink: (id: string, link_enabled: boolean) =>
      apiFetch<{ success: boolean; link_enabled: boolean }>(`/projects/${id}/link/disable`, {
        method: 'POST',
        body: JSON.stringify({ link_enabled }),
      }),
    review: (id: string, payload: { decision: 'approved' | 'needs_clarification' | 'reopen'; internal_note?: string; questions?: any[] }) =>
      apiFetch<any>(`/projects/${id}/review`, { method: 'POST', body: JSON.stringify(payload) }),
    setInterpretation: (id: string, designer_interpretation: string) =>
      apiFetch<any>(`/projects/${id}/interpretation`, {
        method: 'PATCH',
        body: JSON.stringify({ designer_interpretation }),
      }),
  },

  // Clients
  clients: {
    list: () => apiFetch<any[]>('/clients'),
    get: (id: string) => apiFetch<any>(`/clients/${id}`),
    create: (data: any) => apiFetch<any>('/clients', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, patch: any) =>
      apiFetch<any>(`/clients/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
    delete: (id: string) => apiFetch<any>(`/clients/${id}`, { method: 'DELETE' }),
  },

  // Client Intake Form (public via share token)
  clientForm: {
    get: (token: string) => apiFetch<any>(`/c/${token}`),
    autosave: (token: string, data: any) =>
      apiFetch<any>(`/c/${token}/brief`, { method: 'PATCH', body: JSON.stringify(data) }),
    submit: (token: string) => apiFetch<any>(`/c/${token}/submit`, { method: 'POST' }),
    uploadAsset: async (token: string, file: File, category: string) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', category)
      const res = await fetch(`${API_BASE}/c/${token}/assets`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')
      return res.json()
    },
    deleteAsset: (token: string, assetId: string) =>
      apiFetch<any>(`/c/${token}/assets/${assetId}`, { method: 'DELETE' }),
  },
}

