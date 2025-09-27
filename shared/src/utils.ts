import pino from "pino";
import { z } from "zod";

// Logger configuration (basic console logger for shared utilities)
export const logger = {
    level: process.env.LOG_LEVEL || "info",
    info: (message: string, ...args: unknown[]) => console.log(`[INFO] ${message}`, ...args),
    error: (message: string, ...args: unknown[]) => console.error(`[ERROR] ${message}`, ...args),
    warn: (message: string, ...args: unknown[]) => console.warn(`[WARN] ${message}`, ...args),
    debug: (message: string, ...args: unknown[]) => {
        if (process.env.NODE_ENV !== "production") {
            console.debug(`[DEBUG] ${message}`, ...args);
        }
    },
};

// Environment loader (will be validated in the specific service)
export const createEnvLoader = (schema: z.ZodSchema) => {
    return () => schema.parse(process.env);
};

// Export common environment schema
export const commonEnvSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});// Error types
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly details?: unknown;

    constructor(message: string, statusCode: number, code: string, details?: unknown) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.name = "AppError";
    }
}

export class ValidationError extends AppError {
    constructor(message: string, details?: unknown) {
        super(message, 400, "VALIDATION_ERROR", details);
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string) {
        super(`${resource} not found`, 404, "NOT_FOUND");
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized") {
        super(message, 401, "UNAUTHORIZED");
    }
}

export class ForbiddenError extends AppError {
    constructor(message = "Forbidden") {
        super(message, 403, "FORBIDDEN");
    }
}

// Error formatter
export function formatError(error: unknown): {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
    meta: {
        timestamp: string;
        requestId?: string;
    };
} {
    const timestamp = new Date().toISOString();

    if (error instanceof AppError) {
        return {
            success: false,
            error: {
                code: error.code,
                message: error.message,
                details: error.details,
            },
            meta: {
                timestamp,
            },
        };
    }

    if (error instanceof z.ZodError) {
        return {
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "Invalid request data",
                details: error.flatten(),
            },
            meta: {
                timestamp,
            },
        };
    }

    logger.error(String(error));

    return {
        success: false,
        error: {
            code: "INTERNAL_ERROR",
            message: "An unexpected error occurred",
        },
        meta: {
            timestamp,
        },
    };
}

// Success response formatter
export function formatSuccess<T>(
    data: T,
    meta?: Record<string, unknown>
): {
    success: true;
    data: T;
    meta: {
        timestamp: string;
        requestId?: string;
    } & Record<string, unknown>;
} {
    return {
        success: true,
        data,
        meta: {
            timestamp: new Date().toISOString(),
            ...meta,
        },
    };
}

// HTTP client utilities
export interface HttpClientOptions {
    baseURL?: string;
    timeout?: number;
    headers?: Record<string, string>;
}

export class HttpClient {
    private baseURL: string;
    private defaultHeaders: Record<string, string>;
    private timeout: number;

    constructor(options: HttpClientOptions = {}) {
        this.baseURL = options.baseURL || "";
        this.timeout = options.timeout || 10000;
        this.defaultHeaders = {
            "Content-Type": "application/json",
            ...options.headers,
        };
    }

    private async request<T>(
        method: string,
        url: string,
        options: {
            data?: unknown;
            params?: Record<string, string>;
            headers?: Record<string, string>;
        } = {}
    ): Promise<T> {
        const fullUrl = this.baseURL + url;
        const headers = { ...this.defaultHeaders, ...options.headers };

        const config: RequestInit = {
            method,
            headers,
            signal: AbortSignal.timeout(this.timeout),
        };

        if (options.data) {
            config.body = JSON.stringify(options.data);
        }

        const response = await fetch(fullUrl, config);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    }

    async get<T>(url: string, options?: { params?: Record<string, string>; headers?: Record<string, string> }): Promise<T> {
        return this.request<T>("GET", url, options);
    }

    async post<T>(url: string, data?: unknown, options?: { headers?: Record<string, string> }): Promise<T> {
        return this.request<T>("POST", url, { data, ...options });
    }

    async put<T>(url: string, data?: unknown, options?: { headers?: Record<string, string> }): Promise<T> {
        return this.request<T>("PUT", url, { data, ...options });
    }

    async delete<T>(url: string, options?: { headers?: Record<string, string> }): Promise<T> {
        return this.request<T>("DELETE", url, options);
    }
}

// Default HTTP client instance
export const httpClient = new HttpClient();