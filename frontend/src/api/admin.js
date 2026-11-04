import { apiFetch } from "./client"

export function syncAlerts() {
    return apiFetch("/admin/sync", { method: "POST" })
}