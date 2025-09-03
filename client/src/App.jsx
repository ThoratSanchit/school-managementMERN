import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { createContext, useContext, useState, useEffect } from 'react'
import './App.css'

import AuthLayout from './layouts/AuthLayout/AuthLayout.jsx'
import AppLayout from './layouts/AppLayout/AppLayout.jsx'
import LoginPage from './pages/Login/Login.jsx'
import DashboardPage from './pages/Dashboard/Dashboard.jsx'
import StudentsPage from './pages/Students/Students.jsx'
import TeachersPage from './pages/Teachers/Teachers.jsx'
import ClassesPage from './pages/Classes/Classes.jsx'
import AttendancePage from './pages/Attendance/Attendance.jsx'
import ExamsPage from './pages/Exams/Exams.jsx'
import GradesPage from './pages/Grades/Grades.jsx'
import FeesPage from './pages/Fees/Fees.jsx'
import LibraryPage from './pages/Library/Library.jsx'
import { getToken } from './lib/api.js'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    setIsAuthenticated(!!token)
    setIsLoading(false)
  }, [])

  const login = (token) => {
    localStorage.setItem('authToken', token)
    setIsAuthenticated(true)
  }

  const logout = () => {
    localStorage.removeItem('authToken')
    setIsAuthenticated(false)
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      <BrowserRouter>
        <Routes>
          <Route element={<AuthLayout />}> 
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          </Route>
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/teachers" element={<TeachersPage />} />
            <Route path="/classes" element={<ClassesPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/exams" element={<ExamsPage />} />
            <Route path="/grades" element={<GradesPage />} />
            <Route path="/fees" element={<FeesPage />} />
            <Route path="/library" element={<LibraryPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  )
}

export default App
