import { useEffect, useState } from 'react'
import { examsApi } from '../../lib/api'
import Table from '../../components/Table/Table'
import './Exams.css'

export default function ExamsPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [academicYear, setAcademicYear] = useState('')

  const load = () => {
    setLoading(true)
    examsApi.list({ academicYear })
      .then(d => {
        setRows(d.data.map(e => ({
          id: e._id,
          name: e.name,
          type: e.type,
          start: e.startDate ? new Date(e.startDate).toLocaleDateString() : '-',
          end: e.endDate ? new Date(e.endDate).toLocaleDateString() : '-'
        })))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const columns = [
    { title: 'Name', accessor: 'name' },
    { title: 'Type', accessor: 'type' },
    { title: 'Start', accessor: 'start' },
    { title: 'End', accessor: 'end' }
  ]

  return (
    <div className="exams-page">
      <div className="toolbar">
        <input className="input" placeholder="Academic Year" value={academicYear} onChange={e => setAcademicYear(e.target.value)} />
        <button className="btn" onClick={load}>Filter</button>
      </div>
      <Table columns={columns} rows={rows} loading={loading} />
    </div>
  )
}

