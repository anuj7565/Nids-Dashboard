import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

const ORDER = ["low", "medium", "high", "critical"]

function SeverityChart({ data }) {
    const rows = ORDER.map((name) => ({ name, count: data[name] ?? 0 }))

    return (
        <div>
            <h2>Alerts by severity</h2>
            <div style={{ width: "100%", maxWidth: 500, height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rows}>
                        <XAxis dataKey="name" stroke="#aaa" />
                        <YAxis allowDecimals={false} stroke="#aaa" />
                        <Tooltip />
                        <Bar dataKey="count" fill="#4f8ef7" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

export default SeverityChart