import { apiFetch } from "./client"

export function getUsers() {
    return apiFetch("/users")
}

export function updateUserRole(id, role) {
    return apiFetch(`/users/${id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
    })
}