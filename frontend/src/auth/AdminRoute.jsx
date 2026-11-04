import { Navigate } from "react-router-dom"
import { useAuth } from "./AuthContext"

function AdminRoute({ children }) {
    const { token, user, loading, authError, retryAuth } = useAuth()

    if (!token) return <Navigate to="/login" replace />
    if (authError)
        return (
            <div>
                <p role="alert">{authError}</p>
                <button onClick={retryAuth}>Retry</button>
            </div>
        )
    if (loading || !user) return <p>Loading...</p>
    if (user.role !== "admin") return <Navigate to="/alerts" replace />

    return children
}

export default AdminRoute