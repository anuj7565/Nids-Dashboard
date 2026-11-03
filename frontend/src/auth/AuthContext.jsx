import { createContext, useContext, useEffect, useState } from "react"
import { login as loginRequest, getMe } from "../api/auth"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem("token"))
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(() => !!localStorage.getItem("token"))

    useEffect(() => {
        if (!localStorage.getItem("token")) return
        getMe()
            .then(setUser)
            .catch((err) => {
                if (err.status === 401) {
                    localStorage.removeItem("token")
                    setToken(null)
                }
            })
            .finally(() => setLoading(false))
    }, [])

    async function login(email, password) {
        const newToken = await loginRequest(email, password)
        localStorage.setItem("token", newToken)
        try {
            const me = await getMe()
            setUser(me)
            setToken(newToken)
        } catch (err) {
            localStorage.removeItem("token")
            throw err
        }
    }

    function logout() {
        localStorage.removeItem("token")
        setToken(null)
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ token, user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}