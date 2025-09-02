import { useEffect, useState } from 'react'
import { gradesApi } from '../../lib/api'
import Table from '../../components/Table/Table'
import './Grades.css'

export default function GradesPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [examId, setExamId] = useState('')
  const [academicYear, setAcademicYear] = useState('')

  const load = () => {
    setLoading(true)
    gradesApi.list({ examId, academicYear })
      .then(d => {
        setRows(d.data.map(g => ({
          id: g._id,
          student: `${g.student?.user?.firstName || ''} ${g.student?.user?.lastName || ''}`.trim(),
          subject: g.subject?.name || '-',
          obtained: g.marks?.obtained,
          total: g.marks?.total
        })))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const columns = [
    { title: 'Student', accessor: 'student' },
    { title: 'Subject', accessor: 'subject' },
    { title: 'Obtained', accessor: 'obtained' },
    { title: 'Total', accessor: 'total' }
  ]

  return (
    <div className="grades-page">
      <div className="toolbar">
        <input className="input" placeholder="Exam ID (optional)" value={examId} onChange={e => setExamId(e.target.value)} />
        <input className="input" placeholder="Academic Year" value={academicYear} onChange={e => setAcademicYear(e.target.value)} />
        <button className="btn" onClick={load}>Filter</button>
      </div>
      <Table columns={columns} rows={rows} loading={loading} />
    </div>
  )
}

