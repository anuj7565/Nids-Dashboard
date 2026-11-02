import { useState } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "../auth/AuthContext"

function LoginPage() {
    const { token, login } = useAuth()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")

    async function handleSubmit(event) {
        event.preventDefault()
        setError("")
        try {
            await login(email, password)
        } catch {
            setError("Login failed. Check your email and password.")
        }
    }

    if (token) {
        return <Navigate to="/alerts" replace />
    }

    return (
        <form onSubmit={handleSubmit}>
            <h1>NIDS Dashboard</h1>
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit">Log in</button>
            {error && <p>{error}</p>}
        </form>
    )
}

export default LoginPage