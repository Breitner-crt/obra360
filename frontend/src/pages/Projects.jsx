import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'

export default function Projects() {
  const [companies, setCompanies] = useState([])
  const [companyId, setCompanyId] = useState('')
  const [projects, setProjects] = useState([])
  const [prog, setProg] = useState({})
  const [name, setName] = useState('')
  const [client, setClient] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [companyRuc, setCompanyRuc] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api.companies().then((cs) => {
      setCompanies(cs)
      if (cs.length) setCompanyId(cs[0].id)
    }).catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    if (!companyId) return
    api.projects(companyId)
      .then(async (ps) => {
        setProjects(ps)
        const m = {}
        for (const p of ps) {
          try { m[p.id] = (await api.progress(p.id)).progress_percent } catch { m[p.id] = 0 }
        }
        setProg(m)
      })
      .catch((e) => setError(e.message))
  }, [companyId])

  const create = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const p = await api.createProject({ company_id: companyId, name, client: client || null })
      setProjects([...projects, p])
      setProg({ ...prog, [p.id]: 0 })
      setName('')
      setClient('')
    } catch (err) {
      setError(err.message)
    }
  }

  const createCompany = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const c = await api.createCompany({ name: companyName, ruc: companyRuc || null })
      const next = [...companies, c]
      setCompanies(next)
      setCompanyId(c.id)
      setCompanyName('')
      setCompanyRuc('')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <h1 className="page-title">Obras</h1>
      <p className="page-sub">Selecciona la empresa y gestiona sus proyectos.</p>
      {error && <p className="err">{error}</p>}
      {companies.length === 0 && (
        <div className="card">
          <h3>Crea tu primera empresa</h3>
          <p style={{ color: '#64748b' }}>Sin empresa no se pueden crear obras.</p>
          <form onSubmit={createCompany} className="row" style={{ marginTop: 12 }}>
            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Nombre de la empresa" required style={{ flex: 2, minWidth: 180 }} />
            <input value={companyRuc} onChange={(e) => setCompanyRuc(e.target.value)}
              placeholder="RUC (opcional)" style={{ flex: 1, minWidth: 140 }} />
            <button type="submit">+ Crear empresa</button>
          </form>
        </div>
      )}
      <div className="card">
        {companies.length > 0 && (
          <>
            <div className="row">
              <label>Empresa:{' '}
                <select value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>
            </div>
            <form onSubmit={create} className="row" style={{ marginTop: 12 }}>
              <input value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Nombre de la obra" required style={{ flex: 2, minWidth: 180 }} />
              <input value={client} onChange={(e) => setClient(e.target.value)}
                placeholder="Cliente (opcional)" style={{ flex: 1, minWidth: 140 }} />
              <button type="submit">+ Crear obra</button>
            </form>
            <form onSubmit={createCompany} className="row" style={{ marginTop: 12 }}>
              <input value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Nueva empresa" required style={{ flex: 2, minWidth: 180 }} />
              <input value={companyRuc} onChange={(e) => setCompanyRuc(e.target.value)}
                placeholder="RUC (opcional)" style={{ flex: 1, minWidth: 140 }} />
              <button type="submit" className="ghost">+ Empresa</button>
            </form>
          </>
        )}
      </div>
      <div className="grid">
        {projects.map((p) => (
          <Link key={p.id} to={`/projects/${p.id}`} className="proj">
            <span className="t">{p.name}</span>
            <span className="m">{p.client || 'Sin cliente'}{p.location ? ` · ${p.location}` : ''}</span>
            <span><span className={`badge ${p.status}`}>{p.status}</span></span>
            <div className="pbar"><div style={{ width: `${prog[p.id] || 0}%` }} /></div>
            <span className="m">Avance {prog[p.id] ?? 0}%</span>
          </Link>
        ))}
      </div>
      {!projects.length && <p style={{ color: '#64748b' }}>Sin obras para esta empresa.</p>}
    </div>
  )
}
