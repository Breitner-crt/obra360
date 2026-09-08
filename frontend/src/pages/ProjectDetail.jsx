import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api.js'
import Gantt from '../components/Gantt.jsx'

const EMPTY = { name: '', parent_id: '', start_date: '', end_date: '', weight_percent: 0 }

export default function ProjectDetail() {
  const { id } = useParams()
  const [tree, setTree] = useState([])
  const [deps, setDeps] = useState([])
  const [progress, setProgress] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [depForm, setDepForm] = useState({ predecessor_id: '', successor_id: '', dep_type: 'FS' })
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const [t, p, d] = await Promise.all([
        api.activityTree(id), api.progress(id), api.dependencies(id),
      ])
      setTree(t)
      setProgress(p)
      setDeps(d)
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => { load() }, [id])

  const flat = (nodes, out = []) => {
    for (const n of nodes) {
      out.push(n)
      if (n.children?.length) flat(n.children, out)
    }
    return out
  }
  const all = flat(tree)
  const byId = Object.fromEntries(all.map((a) => [a.id, a]))

  const create = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.createActivity({
        project_id: id,
        name: form.name,
        parent_id: form.parent_id || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        weight_percent: Number(form.weight_percent) || 0,
      })
      setForm(EMPTY)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const createDep = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.createDependency(depForm)
      setDepForm({ predecessor_id: '', successor_id: '', dep_type: 'FS' })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const setStatus = async (a, status) => {
    await api.updateActivity(a.id, { status })
    load()
  }

  const remove = async (a) => {
    if (!confirm(`Eliminar "${a.name}" y sus hijas?`)) return
    await api.deleteActivity(a.id)
    load()
  }

  const renderNode = (n, depth = 0) => (
    <div key={n.id}>
      <div className="row" style={{ padding: '6px 0 6px ' + depth * 24 + 'px', borderBottom: '1px solid #f1f5f9' }}>
        <span style={{ color: '#64748b', minWidth: 56 }}>{n.wbs_code}</span>
        <strong style={{ minWidth: 160 }}>{n.name}</strong>
        <span className={`badge ${n.status}`}>{n.status}</span>
        <span style={{ fontSize: 13 }}>{n.progress_percent}%</span>
        <span style={{ fontSize: 12, color: '#64748b' }}>
          {n.start_date || '—'} → {n.end_date || '—'}
        </span>
        <button className="small ghost" onClick={() => setStatus(n, 'en_progreso')}>Iniciar</button>
        <button className="small ghost" onClick={() => setStatus(n, 'completada')}>Completar</button>
        <button className="small danger" onClick={() => remove(n)}>Eliminar</button>
      </div>
      {n.children?.map((c) => renderNode(c, depth + 1))}
    </div>
  )

  return (
    <div>
      <Link to="/obras">← Volver a obras</Link>
      <h1 className="page-title">Cronograma WBS</h1>
      {error && <p className="err">{error}</p>}
      {progress && (
        <div className="stats">
          <div className="stat"><div className="v">{progress.progress_percent}%</div><div className="l">Avance ponderado</div></div>
          <div className="stat"><div className="v">{progress.total_activities}</div><div className="l">Actividades</div></div>
          <div className="stat"><div className="v">{progress.completed_activities}</div><div className="l">Completadas</div></div>
        </div>
      )}

      <div className="card">
        <h3>Diagrama de Gantt</h3>
        <Gantt tree={tree} />
      </div>

      <div className="card">
        <h3>Actividades</h3>
        <form onSubmit={create} className="row" style={{ marginBottom: 12, alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#64748b' }}>
            Nombre
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nombre" required style={{ minWidth: 200 }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#64748b' }}>
            Padre
            <select value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })}>
              <option value="">Sin padre (raíz)</option>
              {all.map((a) => (
                <option key={a.id} value={a.id}>{a.wbs_code} {a.name}</option>
              ))}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#64748b' }}>
            Inicio
            <input type="date" value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#64748b' }}>
            Fin
            <input type="date" value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#64748b' }}>
            Peso %
            <input type="number" min="0" max="100" value={form.weight_percent}
              onChange={(e) => setForm({ ...form, weight_percent: e.target.value })}
              title="Peso %" style={{ width: 84 }} />
          </label>
          <button type="submit">Agregar</button>
        </form>
        <div className="row" style={{ padding: '6px 0', borderBottom: '2px solid #e2e8f0', fontSize: 12, color: '#64748b', fontWeight: 600 }}>
          <span style={{ minWidth: 56 }}>WBS</span>
          <span style={{ minWidth: 160 }}>Actividad</span>
          <span>Estado</span>
          <span>Avance</span>
          <span>Fechas</span>
          <span>Acciones</span>
        </div>
        {tree.map((n) => renderNode(n))}
        {!tree.length && <p style={{ color: '#64748b' }}>Sin actividades. Agrega la primera arriba.</p>}
      </div>

      <div className="card">
        <h3>Dependencias ({deps.length})</h3>
        <form onSubmit={createDep} className="row" style={{ marginBottom: 12 }}>
          <select value={depForm.predecessor_id}
            onChange={(e) => setDepForm({ ...depForm, predecessor_id: e.target.value })} required>
            <option value="">Predecesora…</option>
            {all.map((a) => <option key={a.id} value={a.id}>{a.wbs_code} {a.name}</option>)}
          </select>
          <select value={depForm.dep_type}
            onChange={(e) => setDepForm({ ...depForm, dep_type: e.target.value })}>
            {['FS', 'SS', 'FF', 'SF'].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={depForm.successor_id}
            onChange={(e) => setDepForm({ ...depForm, successor_id: e.target.value })} required>
            <option value="">Sucesora…</option>
            {all.map((a) => <option key={a.id} value={a.id}>{a.wbs_code} {a.name}</option>)}
          </select>
          <button type="submit">Vincular</button>
        </form>
        <table className="tbl">
          <thead><tr><th>Predecesora</th><th>Tipo</th><th>Sucesora</th></tr></thead>
          <tbody>
            {deps.map((d) => (
              <tr key={d.id}>
                <td>{byId[d.predecessor_id]?.wbs_code} {byId[d.predecessor_id]?.name}</td>
                <td><span className="badge">{d.dep_type}{d.lag_days ? ` +${d.lag_days}d` : ''}</span></td>
                <td>{byId[d.successor_id]?.wbs_code} {byId[d.successor_id]?.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!deps.length && <p style={{ color: '#64748b' }}>Sin dependencias todavía.</p>}
      </div>
    </div>
  )
}
