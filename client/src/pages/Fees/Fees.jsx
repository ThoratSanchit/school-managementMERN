import { useEffect, useState } from 'react'
import { feesApi } from '../../lib/api'
import Table from '../../components/Table/Table'
import './Fees.css'

export default function FeesPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [academicYear, setAcademicYear] = useState('')

  const load = () => {
    setLoading(true)
    feesApi.list({ academicYear })
      .then(d => {
        setRows(d.data.map(f => ({
          id: f._id,
          student: `${f.student?.user?.firstName || ''} ${f.student?.user?.lastName || ''}`.trim(),
          class: f.class?.name || '-',
          total: f.totalAmount || 0,
          paid: f.paidAmount || 0,
          due: f.dueAmount || 0,
          status: f.status
        })))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const columns = [
    { title: 'Student', accessor: 'student' },
    { title: 'Class', accessor: 'class' },
    { title: 'Total', accessor: 'total' },
    { title: 'Paid', accessor: 'paid' },
    { title: 'Due', accessor: 'due' },
    { title: 'Status', accessor: 'status' }
  ]

  return (
    <div className="fees-page">
      <div className="toolbar">
        <input className="input" placeholder="Academic Year" value={academicYear} onChange={e => setAcademicYear(e.target.value)} />
        <button className="btn" onClick={load}>Filter</button>
      </div>
      <Table columns={columns} rows={rows} loading={loading} />
    </div>
  )
}

