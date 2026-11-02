const BASE_URL = import.meta.env.VITE_API_URL

export async function apiFetch(path, options = {}) {
    const token = localStorage.getItem("token")
    const headers = { ...options.headers }
    if (token) {
        headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(`${BASE_URL}${path}`, { ...options, headers })
    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`)
    }
    return response.json()
}