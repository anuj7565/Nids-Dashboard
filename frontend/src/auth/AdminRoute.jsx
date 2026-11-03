import { Navigate } from "react-router-dom"
import { useAuth } from "./AuthContext"

function AdminRoute({ children }) {
    const { token, user, loading } = useAuth()

    if (!token) return <Navigate to="/login" replace />
    if (loading || !user) return <p>Loading...</p>
    if (user.role !== "admin") return <Navigate to="/alerts" replace />

    return children
}

export default AdminRoute