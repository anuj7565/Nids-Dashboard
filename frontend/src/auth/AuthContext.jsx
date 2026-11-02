import { createContext, useContext, useState } from "react"
import { login as loginRequest } from "../api/auth"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem("token"))

    async function login(email, password) {
        const newToken = await loginRequest(email, password)
        localStorage.setItem("token", newToken)
        setToken(newToken)
    }

    function logout() {
        localStorage.removeItem("token")
        setToken(null)
    }

    return (
        <AuthContext.Provider value={{ token, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}