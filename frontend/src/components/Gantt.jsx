const DAY = 24 // px por dia
const ROW_H = 28

const STATUS_COLOR = {
  planificada: '#94a3b8',
  en_progreso: '#3b82f6',
  completada: '#22c55e',
  detenida: '#f59e0b',
  cancelada: '#ef4444',
}

function flatten(nodes, depth = 0, out = []) {
  for (const n of nodes) {
    out.push({ ...n, depth })
    if (n.children?.length) flatten(n.children, depth + 1, out)
  }
  return out
}

function parseDay(s) {
  if (!s) return null
  const d = new Date(s + 'T00:00:00')
  return isNaN(d) ? null : d
}

export default function Gantt({ tree }) {
  const rows = flatten(tree).filter((r) => parseDay(r.start_date) && parseDay(r.end_date))
  const skipped = flatten(tree).length - rows.length
  if (!rows.length) return <p>No hay actividades con fechas para graficar.</p>

  const starts = rows.map((r) => parseDay(r.start_date))
  const ends = rows.map((r) => parseDay(r.end_date))
  const min = new Date(Math.min(...starts))
  const max = new Date(Math.max(...ends))
  min.setDate(min.getDate() - 2)
  max.setDate(max.getDate() + 2)
  const totalDays = Math.max(1, Math.round((max - min) / 86400000))
  const width = totalDays * DAY

  const x = (d) => Math.round((parseDay(d) - min) / 86400000) * DAY

  // cabecera por semanas
  const ticks = []
  const cursor = new Date(min)
  while (cursor <= max) {
    ticks.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 7)
  }

  return (
    <div>
      <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
        <div style={{ display: 'flex', minWidth: 320 + width }}>
          <div style={{ width: 320, flexShrink: 0 }}>
            <div style={{ height: 32, borderBottom: '1px solid #e2e8f0', fontWeight: 600, padding: '6px 8px' }}>
              Actividad
            </div>
            {rows.map((r) => (
              <div
                key={r.id}
                style={{
                  height: ROW_H,
                  padding: '4px 8px 4px ' + (8 + r.depth * 20) + 'px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  borderBottom: '1px solid #f1f5f9',
                  fontSize: 13,
                }}
                title={r.wbs_code + ' ' + r.name}
              >
                <span style={{ color: '#64748b', marginRight: 6 }}>{r.wbs_code}</span>
                {r.name}
              </div>
            ))}
          </div>
          <div style={{ position: 'relative', width }}>
            <div style={{ height: 32, position: 'relative', borderBottom: '1px solid #e2e8f0', borderLeft: '1px solid #e2e8f0' }}>
              {ticks.map((t, i) => (
                <span
                  key={i}
                  style={{ position: 'absolute', left: Math.round((t - min) / 86400000) * DAY + 4, top: 6, fontSize: 11, color: '#64748b' }}
                >
                  {t.toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                </span>
              ))}
            </div>
            {rows.map((r) => {
              const left = x(r.start_date)
              const w = Math.max(DAY, x(r.end_date) - left + DAY)
              const color = STATUS_COLOR[r.status] || '#94a3b8'
              return (
                <div key={r.id} style={{ height: ROW_H, position: 'relative', borderBottom: '1px solid #f1f5f9' }}>
                  <div
                    title={`${r.name}: ${r.progress_percent}%`}
                    style={{ position: 'absolute', left, top: 6, width: w, height: 16, background: '#e2e8f0', borderRadius: 8, overflow: 'hidden' }}
                  >
                    <div style={{ width: `${r.progress_percent}%`, height: '100%', background: color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      {skipped > 0 && (
        <p style={{ color: '#64748b', fontSize: 13 }}>
          {skipped} actividad(es) sin fechas no se grafican.
        </p>
      )}
    </div>
  )
}
