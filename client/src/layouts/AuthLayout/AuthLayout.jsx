import { Outlet } from 'react-router-dom'
import './AuthLayout.css'

export default function AuthLayout() {
  return (
    <div className="auth-shell">
      <div className="panel">
        <Outlet />
      </div>
    </div>
  )
}

