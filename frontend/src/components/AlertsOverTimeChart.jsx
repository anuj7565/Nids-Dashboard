import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

function AlertsOverTimeChart({ data }) {
    return (
        <div>
            <h2>Alerts over time</h2>
            {data.length === 0 ? (
                <p>No data yet.</p>
            ) : (
                <div style={{ width: "100%", maxWidth: 700, height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <XAxis dataKey="date" stroke="#aaa" />
                            <YAxis allowDecimals={false} stroke="#aaa" />
                            <Tooltip />
                            <Line type="monotone" dataKey="count" stroke="#4f8ef7" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    )
}

export default AlertsOverTimeChart