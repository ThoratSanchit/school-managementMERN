import { useEffect, useState } from 'react'
import { libraryApi } from '../../lib/api'
import Table from '../../components/Table/Table'
import './Library.css'

export default function LibraryPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  const load = () => {
    setLoading(true)
    libraryApi.list({ q })
      .then(d => {
        setRows(d.data.map(b => ({
          id: b._id,
          title: b.book?.title,
          author: b.book?.author,
          category: b.book?.category,
          available: b.inventory?.availableCopies || 0
        })))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const columns = [
    { title: 'Title', accessor: 'title' },
    { title: 'Author', accessor: 'author' },
    { title: 'Category', accessor: 'category' },
    { title: 'Available', accessor: 'available' }
  ]

  return (
    <div className="library-page">
      <div className="toolbar">
        <input className="input" placeholder="Search books..." value={q} onChange={e => setQ(e.target.value)} />
        <button className="btn" onClick={load}>Search</button>
      </div>
      <Table columns={columns} rows={rows} loading={loading} />
    </div>
  )
}

