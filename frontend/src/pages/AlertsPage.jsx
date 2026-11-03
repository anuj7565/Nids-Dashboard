import { useEffect, useState } from "react"
import { getAlerts, acknowledgeAlert, getStats, getAlertsOverTime } from "../api/alerts"
import { useAuth } from "../auth/AuthContext"
import { Link } from "react-router-dom"
import SeverityChart from "../components/SeverityChart"
import AlertsOverTimeChart from "../components/AlertsOverTimeChart"

const PAGE_SIZE = 20
const EMPTY_FILTERS = { severity: "", status: "", q: "", from: "", to: "" }

function AlertsPage() {
    const { logout, user } = useAuth()
    const [page, setPage] = useState(1)
    const [form, setForm] = useState(EMPTY_FILTERS)
    const [filters, setFilters] = useState(EMPTY_FILTERS)
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [ackId, setAckId] = useState(null)
    const [note, setNote] = useState("")
    const [ackError, setAckError] = useState("")
    const [reloadKey, setReloadKey] = useState(0)
    const [stats, setStats] = useState(null)
    const [overTime, setOverTime] = useState([])

    useEffect(() => {
        setLoading(true)
        setError("")
        getAlerts(page, PAGE_SIZE, filters)
            .then(setData)
            .catch(() => setError("Could not load alerts."))
            .finally(() => setLoading(false))
    }, [page, filters, reloadKey])
    useEffect(() => {
        getStats()
            .then(setStats)
            .catch(() => setStats(null))
    }, [reloadKey])
    useEffect(() => {
        getAlertsOverTime()
            .then(setOverTime)
            .catch(() => setOverTime([]))
    }, [])

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    function applyFilters(e) {
        e.preventDefault()
        setPage(1)
        setFilters(form)
    }

    function clearFilters() {
        setPage(1)
        setForm(EMPTY_FILTERS)
        setFilters(EMPTY_FILTERS)
    }

    function startAck(id) {
        setAckId(id)
        setNote("")
        setAckError("")
    }

    function cancelAck() {
        setAckId(null)
        setNote("")
    }

    async function confirmAck() {
        try {
            await acknowledgeAlert(ackId, note.trim())
            cancelAck()
            setAckError("")
            setReloadKey((k) => k + 1)
        } catch (err) {
            if (err.status === 409) {
                cancelAck()
                setAckError("That alert was already acknowledged.")
                setReloadKey((k) => k + 1)
            } else {
                setAckError(err.message)
            }
        }
    }

    const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1

    return (
        <div>
            <h1>Alerts</h1>
            <button onClick={logout}>Log out</button>
            {user?.role === "admin" && <Link to="/users"> Users</Link>}
            {stats && (
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", margin: "1rem 0" }}>
                    <div style={{ border: "1px solid #888", padding: "0.5rem 1rem" }}>
                        <div>Total</div>
                        <strong>{stats.total}</strong>
                    </div>
                    {Object.entries(stats.by_severity).map(([name, count]) => (
                        <div key={name} style={{ border: "1px solid #888", padding: "0.5rem 1rem" }}>
                            <div>{name}</div>
                            <strong>{count}</strong>
                        </div>
                    ))}
                    {Object.entries(stats.by_status).map(([name, count]) => (
                        <div key={name} style={{ border: "1px solid #888", padding: "0.5rem 1rem" }}>
                            <div>{name}</div>
                            <strong>{count}</strong>
                        </div>
                    ))}
                </div>
            )}
            {stats && <SeverityChart data={stats.by_severity} />}
            {<AlertsOverTimeChart data={overTime} />}

            <form onSubmit={applyFilters}>
                <select name="severity" value={form.severity} onChange={handleChange}>
                    <option value="">All severities</option>
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                    <option value="critical">critical</option>
                </select>
                <select name="status" value={form.status} onChange={handleChange}>
                    <option value="">All statuses</option>
                    <option value="new">new</option>
                    <option value="acknowledged">acknowledged</option>
                </select>
                <input
                    name="q"
                    placeholder="Search IP"
                    value={form.q}
                    onChange={handleChange}
                />
                <input type="date" name="from" value={form.from} onChange={handleChange} />
                <input type="date" name="to" value={form.to} onChange={handleChange} />
                <button type="submit">Apply</button>
                <button type="button" onClick={clearFilters}>Clear</button>
            </form>

            {loading && <p>Loading...</p>}
            {error && <p>{error}</p>}
            {ackError && <p>{ackError}</p>}
            {data && data.items.length === 0 && <p>No alerts match these filters.</p>}
            {data && data.items.length > 0 && (
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
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.items.map((a) => (
                                <tr key={a.id}>
                                    <td><Link to={`/alerts/${a.id}`}>{a.timestamp}</Link></td>
                                    <td>{a.src_ip}</td>
                                    <td>{a.dst_ip}</td>
                                    <td>{a.predicted_label}</td>
                                    <td>{a.severity}</td>
                                    <td>{a.status}</td>
                                    <td>
                                        {a.status !== "new" ? (
                                            "-"
                                        ) : ackId === a.id ? (
                                            <>
                                                <input
                                                    placeholder="Note (optional)"
                                                    maxLength={500}
                                                    value={note}
                                                    onChange={(e) => setNote(e.target.value)}
                                                />
                                                <button onClick={confirmAck}>Confirm</button>
                                                <button onClick={cancelAck}>Cancel</button>
                                            </>
                                        ) : (
                                            <button onClick={() => startAck(a.id)}>
                                                Acknowledge
                                            </button>
                                        )}
                                    </td>
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