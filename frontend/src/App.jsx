import { useEffect, useState } from 'react'

export default function App() {
  const [health, setHealth] = useState('verificando...')

  useEffect(() => {
    fetch('/api/v1/check/')
      .then((r) => r.json())
      .then((d) => setHealth(d.message || 'OK'))
      .catch(() => setHealth('backend no disponible (inicia uvicorn en :8000)'))
  }, [])

  return (
    <div style={{ fontFamily: 'system-ui', padding: 32 }}>
      <h1>OBRA360</h1>
      <p>Sistema de Planificación, Supervisión y Control de Obras</p>
      <p>
        <strong>Backend:</strong> {health}
      </p>
      <p>
        Docs API: <a href="http://localhost:8000/docs">localhost:8000/docs</a>
      </p>
    </div>
  )
}
