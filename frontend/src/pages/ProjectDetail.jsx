import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api.js'
import Gantt from '../components/Gantt.jsx'

const EMPTY = { name: '', parent_id: '', start_date: '', end_date: '', duration_days: '', quantity: '', unit: '', unit_cost: '', weight_percent: 0 }
const UNITS = ['', 'm', 'm2', 'm3', 'kg', 'und', 'glb', 'hh', 'día', 'mes']

export default function ProjectDetail() {
  const { id } = useParams()
  const today = new Date().toISOString().slice(0, 10)
  const [tree, setTree] = useState([])
  const [deps, setDeps] = useState([])
  const [logs, setLogs] = useState([])
  const [progress, setProgress] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [depForm, setDepForm] = useState({ predecessor_id: '', successor_id: '', dep_type: 'FS' })
  const [logForm, setLogForm] = useState({ activity_id: '', log_date: today, progress_percent: 0, note: '', photo_url: '' })
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const [t, p, d, l] = await Promise.all([
        api.activityTree(id), api.progress(id), api.dependencies(id), api.dailyLogs(id),
      ])
      setTree(t)
      setProgress(p)
      setDeps(d)
      setLogs(l)
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
      let duration = form.duration_days === '' ? null : Number(form.duration_days)
      if (duration === null && form.start_date && form.end_date) {
        const ms = new Date(form.end_date) - new Date(form.start_date)
        if (!isNaN(ms) && ms >= 0) duration = Math.round(ms / 86400000) + 1
      }
      await api.createActivity({
        project_id: id,
        name: form.name,
        parent_id: form.parent_id || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        duration_days: duration,
        quantity: form.quantity === '' ? 0 : Number(form.quantity),
        unit: form.unit || null,
        unit_cost: form.unit_cost === '' ? 0 : Number(form.unit_cost),
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

  const createLog = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.createDailyLog({
        project_id: id,
        activity_id: logForm.activity_id,
        log_date: logForm.log_date,
        progress_percent: Number(logForm.progress_percent),
        note: logForm.note || null,
        photo_url: logForm.photo_url || null,
      })
      setLogForm({ activity_id: '', log_date: today, progress_percent: 0, note: '', photo_url: '' })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const removeLog = async (l) => {
    if (!confirm(`Eliminar parte del ${l.log_date} (${l.progress_percent}%)?`)) return
    await api.deleteDailyLog(l.id)
    load()
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

  const durationOf = (n) => {
    if (n.duration_days !== null && n.duration_days !== undefined && n.duration_days !== '') return `${n.duration_days}d`
    if (n.start_date && n.end_date) {
      const ms = new Date(n.end_date) - new Date(n.start_date)
      if (!isNaN(ms) && ms >= 0) return `${Math.round(ms / 86400000) + 1}d`
    }
    return '—'
  }
  const costOf = (n) => (Number(n.quantity) || 0) * (Number(n.unit_cost) || 0)

  const fmtFecha = (s) => {
    if (!s) return '—'
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
    if (m) return `${m[3]}/${m[2]}/${m[1]}`
    const d = new Date(s)
    if (isNaN(d)) return s
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  // Progreso efectivo jerárquico (igual que backend): padre = promedio ponderado de hijas
  const kidsOf = {}
  for (const a of all) {
    const key = a.parent_id || '__root__'
    ;(kidsOf[key] = kidsOf[key] || []).push(a)
  }
  const effCache = {}
  const effOf = (n, seen = new Set()) => {
    if (effCache[n.id] !== undefined) return effCache[n.id]
    if (seen.has(n.id)) return Number(n.progress_percent) || 0
    seen.add(n.id)
    const kids = all.filter((a) => a.parent_id === n.id)
    if (!kids.length) return Number(n.progress_percent) || 0
    const ws = kids.map((k) => Number(k.weight_percent) || 0)
    const vals = kids.map((k) => effOf(k, new Set(seen)))
    const v = ws.reduce((s, w) => s + w, 0) > 0
      ? vals.reduce((s, x, i) => s + x * ws[i], 0) / ws.reduce((s, w) => s + w, 0)
      : vals.reduce((s, x) => s + x, 0) / vals.length
    effCache[n.id] = v
    return v
  }

  // Suma de ponderaciones hermanas del padre seleccionado en el form
  const siblingSum = all
    .filter((a) => (a.parent_id || '') === (form.parent_id || ''))
    .reduce((s, a) => s + (Number(a.weight_percent) || 0), 0)

  const renderRows = (nodes, depth = 0) => nodes.flatMap((n) => [
    <tr key={n.id}>
      <td style={{ color: '#64748b', whiteSpace: 'nowrap' }}>{n.wbs_code}</td>
      <td style={{ paddingLeft: 8 + depth * 20 }}><strong>{n.name}</strong></td>
      <td><span className={`badge ${n.status}`}>{n.status}</span></td>
      <td title="Ponderación dentro de su padre (las hijas deben sumar 100%)">{Number(n.weight_percent) || 0}%</td>
      <td title={n.children?.length ? 'Calculado del promedio ponderado de sus hijas' : 'Avance propio'}>
        {n.children?.length ? `${Math.round(effOf(n))}%` : `${n.progress_percent}%`}
      </td>
      <td style={{ whiteSpace: 'nowrap', color: '#64748b' }}>{fmtFecha(n.start_date)} → {fmtFecha(n.end_date)}</td>
      <td title="Duración en días (tiempo, alimenta el Gantt)">{durationOf(n)}</td>
      <td title="Metrado: cantidad × unidad" style={{ whiteSpace: 'nowrap' }}>
        {(Number(n.quantity) || 0) ? `${n.quantity} ${n.unit || ''}`.trim() : '—'}
      </td>
      <td style={{ whiteSpace: 'nowrap' }}>
        {(Number(n.unit_cost) || 0) ? `S/ ${Number(n.unit_cost).toLocaleString('es-PE', { minimumFractionDigits: 2 })}` : '—'}
      </td>
      <td style={{ whiteSpace: 'nowrap' }} title="Costo total = cantidad × PU">
        {costOf(n) ? `S/ ${costOf(n).toLocaleString('es-PE', { minimumFractionDigits: 2 })}` : '—'}
      </td>
      <td style={{ whiteSpace: 'nowrap' }}>
        <button className="small ghost" onClick={() => setStatus(n, 'en_progreso')}>Iniciar</button>{' '}
        <button className="small ghost" onClick={() => setStatus(n, 'completada')}>Completar</button>{' '}
        <button className="small danger" onClick={() => remove(n)}>Eliminar</button>
      </td>
    </tr>,
    ...renderRows(n.children || [], depth + 1),
  ])

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
            <span style={{ fontSize: 11, color: siblingSum === 100 ? '#16a34a' : '#b45309' }}>
              Hijas de este nivel suman {siblingSum}%{siblingSum === 100 ? ' ✓' : ' (deben sumar 100%)'}
            </span>
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
            Peso % (pond.)
            <input type="number" min="0" max="100" value={form.weight_percent}
              onChange={(e) => setForm({ ...form, weight_percent: e.target.value })}
              title="Ponderación 0-100 para el avance (NO es masa ni duración)" style={{ width: 84 }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#64748b' }}>
            Duración (días)
            <input type="number" min="0" value={form.duration_days}
              onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
              title="Tiempo estimado. Si se deja vacío se calcula de inicio-fin." style={{ width: 90 }} placeholder="auto" />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#64748b' }}>
            Cantidad
            <input type="number" min="0" step="0.01" value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              title="Metrado: cantidad" style={{ width: 100 }} placeholder="0" />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#64748b' }}>
            Unidad
            <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
              {UNITS.map((u) => <option key={u} value={u}>{u || '—'}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#64748b' }}>
            PU S/
            <input type="number" min="0" step="0.01" value={form.unit_cost}
              onChange={(e) => setForm({ ...form, unit_cost: e.target.value })}
              title="Precio unitario. Total = cantidad × PU" style={{ width: 110 }} placeholder="0.00" />
          </label>
          <button type="submit">Agregar</button>
        </form>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>WBS</th>
                <th>Actividad</th>
                <th>Estado</th>
                <th title="Ponderación dentro de su padre">Pond. %</th>
                <th>Avance</th>
                <th>Fechas</th>
                <th>Durac.</th>
                <th>Metrado</th>
                <th>PU</th>
                <th>Costo total</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>{renderRows(tree)}</tbody>
          </table>
        </div>
        {!tree.length && <p style={{ color: '#64748b' }}>Sin actividades. Agrega la primera arriba.</p>}
      </div>

      <div className="card">
        <h3>Parte diario de campo ({logs.length})</h3>
        <p style={{ color: '#64748b', fontSize: 13 }}>
          El supervisor reporta % de avance por actividad. Al guardar se actualiza el progreso,
          el Gantt, la obra y el panel automáticamente.
        </p>
        <form onSubmit={createLog} className="row" style={{ marginBottom: 12, alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#64748b' }}>
            Actividad
            <select value={logForm.activity_id}
              onChange={(e) => setLogForm({ ...logForm, activity_id: e.target.value })} required
              style={{ minWidth: 200 }}>
              <option value="">Selecciona…</option>
              {all.map((a) => <option key={a.id} value={a.id}>{a.wbs_code} {a.name}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#64748b' }}>
            Fecha
            <input type="date" value={logForm.log_date}
              onChange={(e) => setLogForm({ ...logForm, log_date: e.target.value })} required />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#64748b' }}>
            Avance %
            <input type="number" min="0" max="100" value={logForm.progress_percent}
              onChange={(e) => setLogForm({ ...logForm, progress_percent: e.target.value })}
              style={{ width: 90 }} required />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#64748b' }}>
            Nota de campo
            <input value={logForm.note} onChange={(e) => setLogForm({ ...logForm, note: e.target.value })}
              placeholder="Ej. Se vaciaron 12 m3" style={{ minWidth: 200 }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#64748b' }}>
            Foto (URL)
            <input value={logForm.photo_url} onChange={(e) => setLogForm({ ...logForm, photo_url: e.target.value })}
              placeholder="https://…" style={{ minWidth: 180 }} />
          </label>
          <button type="submit">Registrar avance</button>
        </form>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr><th>Fecha</th><th>Actividad</th><th>Avance</th><th>Nota</th><th>Foto</th><th></th></tr></thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{fmtFecha(l.log_date)}</td>
                  <td>{byId[l.activity_id]?.wbs_code} {byId[l.activity_id]?.name || '—'}</td>
                  <td><span className="badge">{l.progress_percent}%</span></td>
                  <td style={{ maxWidth: 280 }}>{l.note || '—'}</td>
                  <td>{l.photo_url ? <a href={l.photo_url} target="_blank" rel="noreferrer">Ver</a> : '—'}</td>
                  <td><button className="small danger" onClick={() => removeLog(l)}>Eliminar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!logs.length && <p style={{ color: '#64748b' }}>Sin partes todavía. Registra el primer avance arriba.</p>}
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
