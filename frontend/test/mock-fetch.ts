type MockResponse = {
  status: number;
  body?: unknown;
};

/** Stubs global fetch; routes are keyed by "METHOD /path" and unknown routes answer 404. */
const mockFetch = (routes: Record<string, MockResponse>) => {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const { status, body } = routes[`${init?.method ?? 'GET'} ${String(input)}`] ?? { status: 404 };
    return new Response(body === undefined ? null : JSON.stringify(body), { status });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

export default mockFetch;
