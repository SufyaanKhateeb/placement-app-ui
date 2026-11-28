import { Effect } from "effect";

export const apiBaseUrl = (import.meta.env.DEV ? "/api/v1" : import.meta.env.VITE_BACKEND_URL || "/api/v1").replace(/\/$/, "");

type ErrorBody = {
    code?: string;
    error?: string;
    errors?: Record<string, string>;
};

type ApiResponse<T> = { status: number; data: T };

class ApiError<T> extends Error {
    constructor(readonly response: ApiResponse<T>) {
        super("API request failed with HTTP " + response.status);
    }
}

export function isApiError<T = ErrorBody>(error: unknown): error is ApiError<T> {
    return error instanceof ApiError;
}

type RequestOptions = {
    params?: Record<string, string | number | undefined>;
    signal?: AbortSignal;
};

type ApiRequest = RequestOptions & {
    method: "get" | "post" | "put" | "patch" | "delete";
    url: string;
    body?: unknown;
};

export function requestEffect<T>({ method, url, body, params }: ApiRequest) {
    return Effect.tryPromise({
        try: async signal => {
            const address = new URL(apiBaseUrl + url, window.location.origin);
            for (const [key, value] of Object.entries(params ?? {})) {
                if (value !== undefined) address.searchParams.set(key, String(value));
            }
            const response = await fetch(address, {
                method: method.toUpperCase(),
                credentials: "include",
                headers: body === undefined ? undefined : { "Content-Type": "application/json" },
                body: body === undefined ? undefined : JSON.stringify(body),
                signal,
            });
            const text = await response.text();
            let data: unknown = null;
            if (text) {
                try {
                    data = JSON.parse(text);
                } catch {
                    data = text;
                }
            }
            if (!response.ok) throw new ApiError({ status: response.status, data });
            return { status: response.status, data: data as T };
        },
        catch: error => error instanceof Error ? error : new Error("API request failed"),
    });
}

function request<T = unknown>(input: ApiRequest) {
    return Effect.runPromise(requestEffect<T>(input), { signal: input.signal });
}

export const api = {
    request,
    get: <T>(url: string, options?: RequestOptions) => request<T>({ method: "get", url, ...options }),
    post: <T>(url: string, body: unknown, options?: RequestOptions) => request<T>({ method: "post", url, body, ...options }),
    put: <T>(url: string, body: unknown) => request<T>({ method: "put", url, body }),
    patch: <T>(url: string, body: unknown) => request<T>({ method: "patch", url, body }),
    delete: (url: string) => request({ method: "delete", url }),
};
