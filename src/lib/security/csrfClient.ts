let csrfTokenPromise: Promise<string | null> | null = null;

export async function getCsrfToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (!csrfTokenPromise) {
    csrfTokenPromise = fetch('/api/csrf')
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

export async function csrfFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = await getCsrfToken();
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set('x-csrf-token', token);
  }
  return fetch(input, {
    ...init,
    headers,
  });
}
