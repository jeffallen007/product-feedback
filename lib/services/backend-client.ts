const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ?? ""
const USE_BACKEND_DEMO = process.env.NEXT_PUBLIC_USE_BACKEND_DEMO === "true"

export class BackendRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "BackendRequestError"
  }
}

export function isBackendDemoEnabled(): boolean {
  return USE_BACKEND_DEMO && API_BASE_URL.length > 0
}

export function isAsyncSynthesisEnabled(): boolean {
  return isBackendDemoEnabled() && process.env.NEXT_PUBLIC_USE_ASYNC_SYNTHESIS === "true"
}

export async function backendRequest<TResponse>(
  path: string,
  init?: RequestInit,
): Promise<TResponse> {
  if (!API_BASE_URL) {
    throw new BackendRequestError(
      "NEXT_PUBLIC_API_BASE_URL is not configured for backend demo mode.",
    )
  }

  let response: Response

  const isFormDataBody =
    typeof FormData !== "undefined" && init?.body instanceof FormData

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        ...(isFormDataBody ? {} : { "Content-Type": "application/json" }),
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to reach the backend demo service."
    throw new BackendRequestError(message)
  }

  if (!response.ok) {
    let message = `Backend request failed with status ${response.status}.`

    try {
      const payload = (await response.json()) as { detail?: string }
      if (payload.detail) {
        message = payload.detail
      }
    } catch {
      // Keep the generic message when the backend response is not JSON.
    }

    throw new BackendRequestError(message)
  }

  return (await response.json()) as TResponse
}
