const API_URL = import.meta.env.VITE_API_URL;

export class ApiError extends Error {
    constructor(status, message) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

let unauthorizedHandler = null;

export function setUnauthorizedHandler(fn) {
    unauthorizedHandler = fn;
}

function extractMessage(body, status) {
    return body?.error?.message ?? `Request failed: ${status}`;
}

export async function apiFetch(path, options = {}) {
    const token = localStorage.getItem("token");
    const headers = { ...options.headers };
    if (token) headers.Authorization = `Bearer ${token}`;

    let response;
    try {
        response = await fetch(`${API_URL}${path}`, { ...options, headers });
    } catch {
        throw new ApiError(0, "Cannot reach the server. Check your connection.");
    }

    if (!response.ok) {
        let body = null;
        try {
            body = await response.json();
        } catch {
            // error response had no JSON body
        }
        if (response.status === 401 && token && path !== "/auth/login") {
            unauthorizedHandler?.();
        }
        throw new ApiError(response.status, extractMessage(body, response.status));
    }

    return response.json();
}