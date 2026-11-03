import { apiFetch } from "./client"

export function getAlerts(page = 1, pageSize = 20, filters = {}) {
    const params = new URLSearchParams({ page, page_size: pageSize })
    for (const [key, value] of Object.entries(filters)) {
        if (value) params.set(key, value)
    }
    return apiFetch(`/alerts?${params}`)
}

export function acknowledgeAlert(id, note) {
    return apiFetch(`/alerts/${id}/acknowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(note ? { note } : {}),
    })
}

export function getAlert(id) {
    return apiFetch(`/alerts/${id}`)
}

export function getStats() {
    return apiFetch("/alerts/stats")
}
export function getAlertsOverTime() {
    return apiFetch("/alerts/over-time")
}