const API_URL = import.meta.env.VITE_API_URL;

export class ApiError extends Error {
    constructor(status, message) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

function extractMessage(body, status) {
    if (body?.error?.message) return body.error.message;
    if (typeof body?.detail === "string") return body.detail;
    if (Array.isArray(body?.detail)) return "Invalid input";
    return `Request failed: ${status}`;
}

export async function apiFetch(path, options = {}) {
    const token = localStorage.getItem("token");
    const headers = { ...options.headers };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_URL}${path}`, { ...options, headers });

    if (!response.ok) {
        let body = null;
        try {
            body = await response.json();
        } catch {
            // error response had no JSON body
        }
        throw new ApiError(response.status, extractMessage(body, response.status));
    }

    return response.json();
}