import { useEffect, useState } from 'react'
import { teachersApi } from '../../lib/api'
import Table from '../../components/Table/Table'
import './Teachers.css'

export default function TeachersPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    setLoading(true)
    teachersApi.list({ page, limit, search })
      .then(d => {
        setRows(d.data.map(t => ({
          id: t._id,
          name: `${t.user?.firstName || ''} ${t.user?.lastName || ''}`.trim(),
          email: t.user?.email,
          department: t.professionalInfo?.department || '-',
          designation: t.professionalInfo?.designation || '-',
          status: t.status
        })))
        setTotal(d.total || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, limit, search])

  const columns = [
    { title: 'Name', accessor: 'name' },
    { title: 'Email', accessor: 'email' },
    { title: 'Department', accessor: 'department' },
    { title: 'Designation', accessor: 'designation' },
    { title: 'Status', accessor: 'status' }
  ]

  const pages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="teachers-page">
      <div className="toolbar">
        <input className="input" placeholder="Search teachers..." value={search} onChange={e => setSearch(e.target.value)} />
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

