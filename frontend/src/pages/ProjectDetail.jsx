import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api.js'
import Gantt from '../components/Gantt.jsx'

const EMPTY = { name: '', parent_id: '', start_date: '', end_date: '', weight_percent: 0 }

export default function ProjectDetail() {
  const { id } = useParams()
  const [tree, setTree] = useState([])
  const [progress, setProgress] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const [t, p] = await Promise.all([api.activityTree(id), api.progress(id)])
      setTree(t)
      setProgress(p)
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

  const setStatus = async (a, status) => {
    await api.updateActivity(a.id, { status })
    load()
  }

  const remove = async (a) => {
    if (!confirm(`Eliminar "${a.name}"?`)) return
    await api.deleteActivity(a.id)
    load()
  }

  const renderNode = (n, depth = 0) => (
    <div key={n.id}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 0 4px ' + depth * 20 + 'px' }}>
        <span style={{ color: '#64748b' }}>{n.wbs_code}</span>
        <strong>{n.name}</strong>
        <span style={{ fontSize: 12, background: '#f1f5f9', borderRadius: 4, padding: '0 6px' }}>{n.status}</span>
        <span style={{ fontSize: 12 }}>{n.progress_percent}%</span>
        <button onClick={() => setStatus(n, 'en_progreso')}>Iniciar</button>
        <button onClick={() => setStatus(n, 'completada')}>Completar</button>
        <button onClick={() => remove(n)}>Eliminar</button>
      </div>
      {n.children?.map((c) => renderNode(c, depth + 1))}
    </div>
  )

  return (
    <div style={{ fontFamily: 'system-ui', padding: 32, maxWidth: 1100 }}>
      <Link to="/">← Obras</Link>
      <h1>Cronograma WBS</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {progress && (
        <p>
          Avance ponderado: <strong>{progress.progress_percent}%</strong>
          {' '}({progress.completed_activities}/{progress.total_activities} completadas)
        </p>
      )}

      <h2>Gantt</h2>
      <Gantt tree={tree} />

      <h2>Actividades</h2>
      <form onSubmit={create} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Nombre" required style={{ padding: 8, minWidth: 200 }} />
        <select value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })}>
          <option value="">Sin padre (raíz)</option>
          {all.map((a) => (
            <option key={a.id} value={a.id}>{a.wbs_code} {a.name}</option>
          ))}
        </select>
        <input type="date" value={form.start_date}
          onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
        <input type="date" value={form.end_date}
          onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
        <input type="number" min="0" max="100" value={form.weight_percent}
          onChange={(e) => setForm({ ...form, weight_percent: e.target.value })}
          title="Peso %" style={{ width: 80 }} />
        <button type="submit">Agregar</button>
      </form>
      {tree.map((n) => renderNode(n))}
    </div>
  )
}
