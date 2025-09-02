import { useEffect, useState } from 'react'
import { attendanceApi } from '../../lib/api'
import Table from '../../components/Table/Table'
import './Attendance.css'

export default function AttendancePage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState('')
  const [academicYear, setAcademicYear] = useState('')

  const load = () => {
    setLoading(true)
    attendanceApi.list({ date, academicYear })
      .then(d => {
        setRows((d.data || []).map(a => ({
          id: a._id,
          student: `${a.student?.user?.firstName || ''} ${a.student?.user?.lastName || ''}`.trim(),
          status: a.status,
          date: new Date(a.date).toLocaleDateString()
        })))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const columns = [
    { title: 'Student', accessor: 'student' },
    { title: 'Status', accessor: 'status' },
    { title: 'Date', accessor: 'date' }
  ]

  return (
    <div className="attendance-page">
      <div className="toolbar">
        <input className="input" placeholder="Date (YYYY-MM-DD)" value={date} onChange={e => setDate(e.target.value)} />
        <input className="input" placeholder="Academic Year" value={academicYear} onChange={e => setAcademicYear(e.target.value)} />
        <button className="btn" onClick={load}>Filter</button>
      </div>
      <Table columns={columns} rows={rows} loading={loading} />
    </div>
  )
}

