import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}> 
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route element={<AppLayout />}>
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
  )
}

export default App
