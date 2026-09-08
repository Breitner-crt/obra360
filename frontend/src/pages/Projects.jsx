import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'

export default function Projects() {
  const [companies, setCompanies] = useState([])
  const [companyId, setCompanyId] = useState('')
  const [projects, setProjects] = useState([])
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api.companies().then((cs) => {
      setCompanies(cs)
      if (cs.length) setCompanyId(cs[0].id)
    }).catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    if (!companyId) return
    api.projects(companyId).then(setProjects).catch((e) => setError(e.message))
  }, [companyId])

  const create = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const p = await api.createProject({ company_id: companyId, name })
      setProjects([...projects, p])
      setName('')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div style={{ fontFamily: 'system-ui', padding: 32, maxWidth: 800 }}>
      <h1>OBRA360 — Obras</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <label>
        Empresa:{' '}
        <select value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>
      <form onSubmit={create} style={{ margin: '16px 0', display: 'flex', gap: 8 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre de la obra"
          required
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit">Crear obra</button>
      </form>
      <ul>
        {projects.map((p) => (
          <li key={p.id}>
            <Link to={`/projects/${p.id}`}>{p.name}</Link>
            {' '}— {p.status} {p.budget ? `— $${p.budget}` : ''}
          </li>
        ))}
      </ul>
      {!projects.length && <p>Sin obras. Crea la primera.</p>}
    </div>
  )
}
