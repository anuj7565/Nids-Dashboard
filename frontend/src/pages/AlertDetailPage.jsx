import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { getAlert } from "../api/alerts"

function AlertDetailPage() {
    const { id } = useParams()
    const [alert, setAlert] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect -- standard fetch-on-change pattern */
        setLoading(true)
        setError("")
        setAlert(null)
        /* eslint-enable react-hooks/set-state-in-effect */
        getAlert(id)
            .then(setAlert)
            .catch((err) => setError(err.status === 404 ? "Alert not found." : err.message))
            .finally(() => setLoading(false))
    }, [id])

    return (
        <div className="page">
            <Link to="/alerts">Back to alerts</Link>
            <h1>Alert {id}</h1>
            {loading && <p>Loading...</p>}
            {error && <p className="error">{error}</p>}
            {alert && (
                <dl className="details">
                    <dt>External ID</dt>
                    <dd>{alert.external_id}</dd>
                    <dt>Time</dt>
                    <dd>{alert.timestamp}</dd>
                    <dt>Source IP</dt>
                    <dd>{alert.src_ip}</dd>
                    <dt>Destination IP</dt>
                    <dd>{alert.dst_ip}</dd>
                    <dt>Duration</dt>
                    <dd>{alert.duration}</dd>
                    <dt>Protocol</dt>
                    <dd>{alert.protocol_type}</dd>
                    <dt>Service</dt>
                    <dd>{alert.service}</dd>
                    <dt>Flag</dt>
                    <dd>{alert.flag}</dd>
                    <dt>Label</dt>
                    <dd>{alert.predicted_label}</dd>
                    <dt>Severity</dt>
                    <dd>{alert.severity}</dd>
                    <dt>Status</dt>
                    <dd>{alert.status}</dd>
                </dl>
            )}
        </div>
    )
}

export default AlertDetailPage