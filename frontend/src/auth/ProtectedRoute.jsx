import { Navigate } from "react-router-dom"
import { useAuth } from "./AuthContext"

function ProtectedRoute({ children }) {
    const { token, authError, retryAuth } = useAuth()

    if (!token) return <Navigate to="/login" replace />
    if (authError)
        return (
            <div>
                <p role="alert">{authError}</p>
                <button onClick={retryAuth}>Retry</button>
            </div>
        )
    return children
}

export default ProtectedRoute