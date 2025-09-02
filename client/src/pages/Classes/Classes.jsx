import { useEffect, useMemo, useState } from 'react'
import { classesApi } from '../../lib/api'
import Table from '../../components/Table/Table'
import './Classes.css'

export default function ClassesPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [academicYear, setAcademicYear] = useState('')
  const [level, setLevel] = useState('')

  const load = () => {
    setLoading(true)
    classesApi.list({ academicYear, level })
      .then(d => {
        setRows(d.data.map(c => ({
          id: c._id,
          name: c.name,
          level: c.level,
          subjects: (c.subjects || []).length,
          sections: (c.sections || []).length
        })))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const columns = useMemo(() => ([
    { title: 'Name', accessor: 'name' },
    { title: 'Level', accessor: 'level' },
    { title: 'Subjects', accessor: 'subjects' },
    { title: 'Sections', accessor: 'sections' }
  ]), [])

  return (
    <div className="classes-page">
      <div className="toolbar">
        <input className="input" placeholder="Academic Year (e.g. 2024-2025)" value={academicYear} onChange={e => setAcademicYear(e.target.value)} />
        <input className="input" placeholder="Level (e.g. 10)" value={level} onChange={e => setLevel(e.target.value)} />
        <button className="btn" onClick={load}>Filter</button>
      </div>
      <Table columns={columns} rows={rows} loading={loading} />
    </div>
  )
}

