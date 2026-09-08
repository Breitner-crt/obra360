import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'

export function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [msg, setMsg] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setMsg(null)
    try {
      const u = await api.login(form)
      setMsg({ ok: true, text: `Bienvenido ${u.name || u.email} (rol: ${u.role})` })
    } catch (err) {
      setMsg({ ok: false, text: err.message })
    }
  }

  return (
    <div style={{ maxWidth: 420 }}>
      <h1 className="page-title">Ingresar</h1>
      <p className="page-sub">Accede con tu cuenta de OBRA360.</p>
      {msg && <p className={msg.ok ? 'card' : 'err'}>{msg.text}</p>}
      <form onSubmit={submit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input type="email" placeholder="Correo" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input type="password" placeholder="Contraseña" value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <button type="submit">Entrar</button>
      </form>
      <p>¿Sin cuenta? <Link to="/registro">Regístrate</Link></p>
    </div>
  )
}

export function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm_password: '', phone: '' })
  const [msg, setMsg] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setMsg(null)
    try {
      const u = await api.register(form)
      setMsg({ ok: true, text: `Cuenta creada para ${u.email}. Un administrador te asignará empresa y rol.` })
    } catch (err) {
      setMsg({ ok: false, text: err.message })
    }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <div style={{ maxWidth: 420 }}>
      <h1 className="page-title">Crear cuenta</h1>
      <p className="page-sub">Regístrate para empezar a usar OBRA360.</p>
      {msg && <p className={msg.ok ? 'card' : 'err'}>{msg.text}</p>}
      <form onSubmit={submit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input placeholder="Nombre" value={form.name} onChange={set('name')} required />
        <input type="email" placeholder="Correo" value={form.email} onChange={set('email')} required />
        <input placeholder="Teléfono (opcional)" value={form.phone} onChange={set('phone')} />
        <input type="password" placeholder="Contraseña" value={form.password} onChange={set('password')} required />
        <input type="password" placeholder="Confirmar contraseña" value={form.confirm_password} onChange={set('confirm_password')} required />
        <button type="submit">Registrarme</button>
      </form>
    </div>
  )
}
