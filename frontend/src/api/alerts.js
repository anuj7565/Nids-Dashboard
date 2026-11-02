import { apiFetch } from "./client"

export function getAlerts(page = 1, pageSize = 20) {
    const params = new URLSearchParams({ page, page_size: pageSize })
    return apiFetch(`/alerts?${params}`)
}