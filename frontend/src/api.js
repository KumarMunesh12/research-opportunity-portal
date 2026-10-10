const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
).replace(/\/+$/, '');

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      `Could not reach the API at ${API_BASE_URL}. Check that the backend is running.`,
    );
  }

  const text = await response.text();
  let data;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(
        response.ok
          ? 'The API returned an invalid response.'
          : `The API request failed with status ${response.status} and an invalid response.`,
      );
    }
  }

  if (!response.ok) {
    throw new Error(
      data && typeof data.error === 'string'
        ? data.error
        : `The API request failed with status ${response.status}.`,
    );
  }

  return data;
}

export const opportunitiesApi = {
  list: () => request('/opportunities'),
  get: (id) => request(`/opportunities/${encodeURIComponent(id)}`),
  create: (opportunity) =>
    request('/opportunities', {
      method: 'POST',
      body: JSON.stringify(opportunity),
    }),
  update: (id, opportunity) =>
    request(`/opportunities/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(opportunity),
    }),
  remove: (id) =>
    request(`/opportunities/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};
