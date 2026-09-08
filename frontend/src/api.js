function formatDetail(detail, fallback) {
  if (!detail) return fallback
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    // Errores de validación FastAPI/Pydantic: [{loc, msg, type}]
    return detail
      .map((d) => {
        if (typeof d === 'string') return d
        if (d && typeof d === 'object') {
          const loc = Array.isArray(d.loc) ? d.loc.filter((x) => x !== 'body').join('.') : ''
          const msg = d.msg || d.message || JSON.stringify(d)
          return loc ? `${loc}: ${msg}` : msg
        }
        return String(d)
      })
      .join('; ')
  }
  if (typeof detail === 'object') {
    return detail.msg || detail.message || detail.error || JSON.stringify(detail)
  }
  return String(detail)
}

async function req(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    // Vercel/500 a veces devuelve HTML, no JSON
    const text = await res.text().catch(() => '')
    let body = {}
    try {
      body = text ? JSON.parse(text) : {}
    } catch {
      body = {}
    }
    const detail = body.detail ?? body.message ?? body.error
    throw new Error(formatDetail(detail, text.slice(0, 200) || `HTTP ${res.status}`))
  }
  return res.json()
}

export const api = {
  companies: () => req('/api/v1/companies/'),
  createCompany: (data) =>
    req('/api/v1/companies/', { method: 'POST', body: JSON.stringify(data) }),
  projects: (companyId) => req(`/api/v1/projects/?company_id=${companyId}`),
  createProject: (data) =>
    req('/api/v1/projects/', { method: 'POST', body: JSON.stringify(data) }),
  activities: (projectId) => req(`/api/v1/activities/?project_id=${projectId}`),
  activityTree: (projectId) => req(`/api/v1/activities/tree?project_id=${projectId}`),
  createActivity: (data) =>
    req('/api/v1/activities/', { method: 'POST', body: JSON.stringify(data) }),
  updateActivity: (id, data) =>
    req(`/api/v1/activities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteActivity: (id) => req(`/api/v1/activities/${id}`, { method: 'DELETE' }),
  progress: (projectId) => req(`/api/v1/projects/${projectId}/progress`),
  dependencies: (projectId) => req(`/api/v1/dependencies/?project_id=${projectId}`),
  createDependency: (data) =>
    req('/api/v1/dependencies/', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) =>
    req('/api/v1/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data) =>
    req('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  authStatus: () => req('/api/v1/auth/status'),
  dailyLogs: (projectId, activityId) =>
    req(`/api/v1/daily-logs/?project_id=${projectId}${activityId ? `&activity_id=${activityId}` : ''}`),
  createDailyLog: (data) =>
    req('/api/v1/daily-logs/', { method: 'POST', body: JSON.stringify(data) }),
  deleteDailyLog: (id) => req(`/api/v1/daily-logs/${id}`, { method: 'DELETE' }),
}
