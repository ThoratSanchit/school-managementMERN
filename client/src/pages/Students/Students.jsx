import { useEffect, useState } from 'react'
import { studentsApi } from '../../lib/api'
import Table from '../../components/Table/Table'
import './Students.css'

export default function StudentsPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit, setLimit] = useState(10)

  useEffect(() => {
    setLoading(true)
    studentsApi.list({ page, limit, search })
      .then(d => {
        setRows(d.data.map(s => ({
          id: s._id,
          name: `${s.user?.firstName || ''} ${s.user?.lastName || ''}`.trim(),
          email: s.user?.email,
          class: s.class?.name || '-',
          section: s.section?.name || '-',
          academicYear: s.academicYear
        })))
        setTotal(d.total || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, limit, search])

  const columns = [
    { title: 'Name', accessor: 'name' },
    { title: 'Email', accessor: 'email' },
    { title: 'Class', accessor: 'class' },
    { title: 'Section', accessor: 'section' },
    { title: 'Academic Year', accessor: 'academicYear' }
  ]

  const pages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="students-page">
      <div className="toolbar">
        <input className="input" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <Table columns={columns} rows={rows} loading={loading} />
      <div className="pager">
        <button className="btn" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page<=1}>Prev</button>
        <span className="muted">Page {page} / {pages}</span>
        <button className="btn" onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page>=pages}>Next</button>
      </div>
    </div>
  )
}

