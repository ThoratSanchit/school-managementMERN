import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../App.jsx'
import { authApi } from '../../lib/api.js'
import './Login.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await authApi.login({ email, password })
      login(data.token)
      navigate('/dashboard')
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

