import { useState } from 'react'
import './Login.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Login failed')
      localStorage.setItem('authToken', data.token)
      window.location.href = '/dashboard'
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="title">Welcome back</h2>
      <p className="subtitle">Sign in to your account</p>
      <form className="form" onSubmit={onSubmit}>
        <label className="label">Email</label>
        <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        <label className="label">Password</label>
        <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        {error && <div className="error">{error}</div>}
        <button className="btn btn-primary w-full" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
      </form>
    </div>
  )
}

