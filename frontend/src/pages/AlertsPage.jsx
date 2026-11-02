import { useEffect, useState } from "react"
import { getAlerts } from "../api/alerts"
import { useAuth } from "../auth/AuthContext"

const PAGE_SIZE = 20

function AlertsPage() {
    const { logout } = useAuth()
    const [page, setPage] = useState(1)
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        setLoading(true)
        setError("")
        getAlerts(page, PAGE_SIZE)
            .then(setData)
            .catch(() => setError("Could not load alerts."))
            .finally(() => setLoading(false))
    }, [page])

    const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1

    return (
        <div>
            <h1>Alerts</h1>
            <button onClick={logout}>Log out</button>
            {loading && <p>Loading...</p>}
            {error && <p>{error}</p>}
            {data && (
                <>
                    <table>
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Source IP</th>
                                <th>Destination IP</th>
                                <th>Label</th>
                                <th>Severity</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.items.map((a) => (
                                <tr key={a.id}>
                                    <td>{a.timestamp}</td>
                                    <td>{a.src_ip}</td>
                                    <td>{a.dst_ip}</td>
                                    <td>{a.predicted_label}</td>
                                    <td>{a.severity}</td>
                                    <td>{a.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button onClick={() => setPage(page - 1)} disabled={page <= 1}>
                        Previous
                    </button>
                    <span> Page {page} of {totalPages} </span>
                    <button onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
                        Next
                    </button>
                </>
            )}
        </div>
    )
}

export default AlertsPage