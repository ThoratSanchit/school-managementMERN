import { Outlet, NavLink } from 'react-router-dom'
import './AppLayout.css'

export default function AppLayout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">SchoolMS</div>
        <nav className="nav">
          <NavLink to="/dashboard" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Dashboard</NavLink>
          <NavLink to="/students" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Students</NavLink>
          <NavLink to="/teachers" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Teachers</NavLink>
          <NavLink to="/classes" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Classes</NavLink>
          <NavLink to="/attendance" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Attendance</NavLink>
          <NavLink to="/exams" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Exams</NavLink>
          <NavLink to="/grades" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Grades</NavLink>
          <NavLink to="/fees" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Fees</NavLink>
          <NavLink to="/library" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Library</NavLink>
        </nav>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="title">Dashboard</div>
          <div className="spacer" />
          <button className="btn btn-primary">Logout</button>
        </header>
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

