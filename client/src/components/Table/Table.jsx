import './Table.css'

export default function Table({ columns = [], rows = [], loading = false, emptyText = 'No data' }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key || col.accessor}>{col.title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td className="muted" colSpan={columns.length}>Loading...</td></tr>
          ) : rows.length ? (
            rows.map((row, idx) => (
              <tr key={row.id || idx}>
                {columns.map(col => (
                  <td key={col.key || col.accessor}>{
                    typeof col.render === 'function' ? col.render(row) : row[col.accessor]
                  }</td>
                ))}
              </tr>
            ))
          ) : (
            <tr><td className="muted" colSpan={columns.length}>{emptyText}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

