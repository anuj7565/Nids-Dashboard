import { useEffect, useState } from "react"
import { getAlerts, acknowledgeAlert, getStats, getAlertsOverTime } from "../api/alerts"
import { useAuth } from "../auth/AuthContext"
import { Link } from "react-router-dom"
import SeverityChart from "../components/SeverityChart"
import AlertsOverTimeChart from "../components/AlertsOverTimeChart"
import { syncAlerts } from "../api/admin"

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
    const [syncing, setSyncing] = useState(false)
    const [syncMsg, setSyncMsg] = useState("")
    const [filterError, setFilterError] = useState("")

    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect -- standard fetch-on-change pattern */
        setLoading(true)
        setError("")
        /* eslint-enable react-hooks/set-state-in-effect */
        getAlerts(page, PAGE_SIZE, filters)
            .then(setData)
            .catch((err) => setError(err.message))
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
    }, [reloadKey])

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    function applyFilters(e) {
        e.preventDefault()
        if (form.from && form.to && form.from > form.to) {
            setFilterError("The 'from' date must be on or before the 'to' date.")
            return
        }
        setFilterError("")
        setPage(1)
        setFilters(form)
    }

    function clearFilters() {
        setFilterError("")
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
    async function handleSync() {
        setSyncing(true)
        setSyncMsg("")
        try {
            const res = await syncAlerts()
            setSyncMsg(`Sync complete: ${JSON.stringify(res.result)}`)
            setReloadKey((k) => k + 1)
        } catch (err) {
            setSyncMsg(`Sync failed: ${err.message}`)
        } finally {
            setSyncing(false)
        }
    }
    const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1

    return (
        <div className="page">
            <div className="topbar">
                <h1>Alerts</h1>
                <div className="topbar-actions">
                    {user?.role === "admin" && <Link to="/users">Users</Link>}
                    {user?.role === "admin" && (
                        <button onClick={handleSync} disabled={syncing}>
                            {syncing ? "Syncing..." : "Sync from NIDS"}
                        </button>
                    )}
                    <button onClick={logout}>Log out</button>
                </div>
            </div>
            {syncMsg && <p className="notice">{syncMsg}</p>}
            {stats && (
                <div className="stats">
                    <div className="stat">
                        <span>Total</span>
                        <strong>{stats.total}</strong>
                    </div>
                    {Object.entries(stats.by_severity).map(([name, count]) => (
                        <div key={name} className="stat">
                            <span>{name}</span>
                            <strong>{count}</strong>
                        </div>
                    ))}
                    {Object.entries(stats.by_status).map(([name, count]) => (
                        <div key={name} className="stat">
                            <span>{name}</span>
                            <strong>{count}</strong>
                        </div>
                    ))}
                </div>
            )}
            <div className="charts">
                {stats && <SeverityChart data={stats.by_severity} />}
                <AlertsOverTimeChart data={overTime} />
            </div>

            <form className="filters" onSubmit={applyFilters}>
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
            {filterError && <p className="error" role="alert">{filterError}</p>}
            {loading && <p>Loading...</p>}
            {error && <p className="error" role="alert">{error}</p>}
            {ackError && <p className="error" role="alert">{ackError}</p>}
            {data && data.items.length === 0 && <p>No alerts match these filters.</p>}
            {data && data.items.length > 0 && (
                <>
                    <div className="table-wrap">
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
                                        <td><span className={`badge sev-${a.severity}`}>{a.severity}</span></td>
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
                        </table></div>
                    <div className="pagination">
                        <button onClick={() => setPage(page - 1)} disabled={page <= 1}>
                            Previous
                        </button>
                        <span>Page {page} of {totalPages}</span>
                        <button onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
                            Next
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}

export default AlertsPage