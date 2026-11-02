import { apiFetch } from "./client"

export async function login(email, password) {
    const body = new URLSearchParams({ username: email, password })
    const data = await apiFetch("/auth/login", { method: "POST", body })
    return data.access_token
}