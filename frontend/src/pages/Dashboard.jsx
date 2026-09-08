import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'

export default function Dashboard() {
  const [stats, setStats] = useState({ obras: 0, actividades: 0, completadas: 0, avance: 0 })
  const [recent, setRecent] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const companies = await api.companies()
        if (!companies.length) return
        const cid = companies[0].id
        const projects = await api.projects(cid)
        let acts = 0, done = 0, sumProg = 0, n = 0
        for (const p of projects) {
          try {
            const pr = await api.progress(p.id)
            acts += pr.total_activities
            done += pr.completed_activities
            sumProg += pr.progress_percent
            n++
          } catch { /* obra sin actividades */ }
        }
        setStats({
          obras: projects.length,
          actividades: acts,
          completadas: done,
          avance: n ? Math.round(sumProg / n) : 0,
        })
        setRecent(projects.slice(-5).reverse())
      } catch (e) {
        setError(e.message)
      }
    })()
  }, [])

  return (
    <div>
      <h1 className="page-title">Panel de control</h1>
      <p className="page-sub">Planificación, supervisión y control de obras en un vistazo.</p>
      {error && <p className="err">{error}</p>}
      <div className="stats">
        <div className="stat"><div className="v">{stats.obras}</div><div className="l">Obras activas</div></div>
        <div className="stat"><div className="v">{stats.actividades}</div><div className="l">Actividades WBS</div></div>
        <div className="stat"><div className="v">{stats.completadas}</div><div className="l">Completadas</div></div>
        <div className="stat"><div className="v">{stats.avance}%</div><div className="l">Avance promedio</div></div>
      </div>
      <div className="card">
        <h3>Obras recientes</h3>
        {recent.length === 0 && <p style={{ color: '#64748b' }}>Aún no hay obras. <Link to="/obras">Crea la primera</Link>.</p>}
        {recent.map((p) => (
          <div key={p.id} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
            <Link to={`/projects/${p.id}`}><strong>{p.name}</strong></Link>
            {' '}<span className={`badge ${p.status}`}>{p.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
