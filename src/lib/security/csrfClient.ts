export async function getCsrfToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const response = await fetch('/api/csrf');
  if (!response.ok) return null;
  const data = await response.json();
  return data.token ?? null;
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
