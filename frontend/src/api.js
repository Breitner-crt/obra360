async function req(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `HTTP ${res.status}`)
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
}
