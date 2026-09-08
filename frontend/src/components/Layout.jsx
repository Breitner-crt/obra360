import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'

export default function Layout() {
  const [health, setHealth] = useState('…')
  useEffect(() => {
    fetch('/api/v1/check/')
      .then((r) => r.json())
      .then((d) => setHealth('API OK'))
      .catch(() => setHealth('API caída'))
  }, [])

  const link = ({ isActive }) => (isActive ? 'active' : undefined)

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand"><span>OBRA</span><span className="full">360</span></div>
        <nav className="nav">
          <NavLink to="/" end className={link}>🏠 <span className="lbl">Panel</span></NavLink>
          <NavLink to="/obras" className={link}>🏗️ <span className="lbl">Obras</span></NavLink>
          <NavLink to="/login" className={link}>👤 <span className="lbl">Acceso</span></NavLink>
        </nav>
        <div className="side-foot">Backend: {health}</div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
