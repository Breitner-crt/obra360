import { useEffect, useState } from 'react'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import Projects from './pages/Projects.jsx'
import ProjectDetail from './pages/ProjectDetail.jsx'

function Health() {
  const [health, setHealth] = useState('verificando...')
  useEffect(() => {
    fetch('/api/v1/check/')
      .then((r) => r.json())
      .then((d) => setHealth(d.message || 'OK'))
      .catch(() => setHealth('backend no disponible (inicia uvicorn en :8000)'))
  }, [])
  return <p style={{ color: '#64748b', fontSize: 13 }}>Backend: {health}</p>
}

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ fontFamily: 'system-ui' }}>
        <nav style={{ padding: '12px 32px', borderBottom: '1px solid #e2e8f0' }}>
          <Link to="/" style={{ fontWeight: 700, textDecoration: 'none' }}>OBRA360</Link>
        </nav>
        <Routes>
          <Route path="/" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
        </Routes>
        <footer style={{ padding: '12px 32px' }}>
          <Health />
        </footer>
      </div>
    </BrowserRouter>
  )
}
