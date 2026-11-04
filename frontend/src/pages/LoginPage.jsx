import { useState } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "../auth/AuthContext"

function LoginPage() {
    const { token, login } = useAuth()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [submitting, setSubmitting] = useState(false)

    async function handleSubmit(event) {
        event.preventDefault()
        setError("")
        setSubmitting(true)
        try {
            await login(email.trim(), password)
        } catch (err) {
            setError(
                err.status === 401
                    ? "Login failed. Check your email and password."
                    : err.message
            )
        } finally {
            setSubmitting(false)
        }
    }

    if (token) {
        return <Navigate to="/alerts" replace />
    }

    return (
        <form className="login" onSubmit={handleSubmit}>
            <h1>NIDS Dashboard</h1>
            <input
                type="email"
                placeholder="Email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                type="password"
                placeholder="Password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" disabled={submitting}>
                {submitting ? "Logging in..." : "Log in"}
            </button>
            {error && <p className="error" role="alert">{error}</p>}
        </form>
    )
}

export default LoginPage