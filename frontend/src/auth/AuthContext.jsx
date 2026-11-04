import { createContext, useContext, useEffect, useState } from "react"
import { login as loginRequest, getMe } from "../api/auth"
import { setUnauthorizedHandler } from "../api/client"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem("token"))
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(() => !!localStorage.getItem("token"))
    const [authError, setAuthError] = useState("")
    const [retryKey, setRetryKey] = useState(0)

    useEffect(() => {
        setUnauthorizedHandler(() => {
            localStorage.removeItem("token")
            setToken(null)
            setUser(null)
        })
        return () => setUnauthorizedHandler(null)
    }, [])

    useEffect(() => {
        if (!localStorage.getItem("token")) return
        getMe()
            .then(setUser)
            .catch((err) => {
                if (err.status === 401) {
                    localStorage.removeItem("token")
                    setToken(null)
                } else {
                    setAuthError(err.message)
                }
            })
            .finally(() => setLoading(false))
    }, [retryKey])

    async function login(email, password) {
        const newToken = await loginRequest(email, password)
        localStorage.setItem("token", newToken)
        try {
            const me = await getMe()
            setUser(me)
            setAuthError("")
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
        setAuthError("")
    }

    function retryAuth() {
        setAuthError("")
        setLoading(true)
        setRetryKey((k) => k + 1)
    }

    return (
        <AuthContext.Provider
            value={{ token, user, loading, authError, login, logout, retryAuth }}
        >
            {children}
        </AuthContext.Provider>
    )
}
// eslint-disable-next-line react-refresh/only-export-components -- hook shares the file with its provider
export function useAuth() {
    return useContext(AuthContext)
}