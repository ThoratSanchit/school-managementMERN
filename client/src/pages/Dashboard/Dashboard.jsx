import { useEffect, useState } from 'react'
import './Dashboard.css'

export default function DashboardPage() {
  const [me, setMe] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      window.location.href = '/login'
      return
    }
    fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(d => setMe(d?.data || null))
    .catch(() => {})
  }, [])

  return (
    <div className="grid">
      <div className="card">
        <div className="card-title">Welcome</div>
        <div className="card-subtitle">{me ? `${me.firstName} ${me.lastName} (${me.role})` : 'Loading...'}</div>
      </div>
      <div className="card">
        <div className="card-title">Quick Links</div>
        <div className="links">
          <a href="#" className="chip">Students</a>
          <a href="#" className="chip">Teachers</a>
          <a href="#" className="chip">Classes</a>
          <a href="#" className="chip">Attendance</a>
          <a href="#" className="chip">Exams</a>
          <a href="#" className="chip">Grades</a>
          <a href="#" className="chip">Fees</a>
          <a href="#" className="chip">Library</a>
        </div>
      </div>
    </div>
  )
}

