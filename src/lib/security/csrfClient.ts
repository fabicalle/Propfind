let csrfTokenPromise: Promise<string | null> | null = null;

export async function getCsrfToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (!csrfTokenPromise) {
    csrfTokenPromise = fetch('/api/csrf', {
      credentials: 'include',
    })
      .then((response) => {
        if (!response.ok) {
          csrfTokenPromise = null;
          return null;
        }
        return response.json().then((data) => data.token ?? null);
      })
      .catch(() => {
        csrfTokenPromise = null;
        return null;
      });
  }
  return csrfTokenPromise;
}

export function invalidateCsrfToken(): void {
  csrfTokenPromise = null;
}

export async function csrfFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = await getCsrfToken();
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set('x-csrf-token', token);
  }
  const response = await fetch(input, {
    ...init,
    credentials: 'include',
    headers,
  });

  if (response.status === 403) {
    invalidateCsrfToken();
  }

  return response;
}
