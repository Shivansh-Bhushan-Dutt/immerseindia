// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Explicit helpers to manage auth token from anywhere
export const setAuthToken = (token: string) => {
  try {
    localStorage.setItem('authToken', token);
  } catch (e) {
    // ignore storage errors in non-browser environments
  }
};

export const clearAuthToken = () => {
  try {
    localStorage.removeItem('authToken');
  } catch (e) {
    // ignore storage errors in non-browser environments
  }
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return response.json();
};

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await handleResponse(response);
    
    // Store token for future requests
    if (data.token) {
      setAuthToken(data.token);
    }
    
    return data;
  },

  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  logout: () => {
    localStorage.removeItem('authToken');
  }
};

// Experiences API
export const experiencesAPI = {
  getAll: async (params?: { page?: number; limit?: number; region?: string; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.region && params.region !== 'All') queryParams.append('region', params.region);
    if (params?.search) queryParams.append('search', params.search);
    
    const url = `${API_BASE_URL}/experiences${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/experiences/${id}`);
    return handleResponse(response);
  },

  create: async (data: FormData | any) => {
    const token = localStorage.getItem('authToken');
    const isFormData = data instanceof FormData;
    const response = await fetch(`${API_BASE_URL}/experiences`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(!isFormData && { 'Content-Type': 'application/json' })
      },
      body: isFormData ? data : JSON.stringify(data)
    });
    return handleResponse(response);
  },

  update: async (id: string, data: FormData | any) => {
    const token = localStorage.getItem('authToken');
    const isFormData = data instanceof FormData;
    const response = await fetch(`${API_BASE_URL}/experiences/${id}`, {
      method: 'PUT',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(!isFormData && { 'Content-Type': 'application/json' })
      },
      body: isFormData ? data : JSON.stringify(data)
    });
    return handleResponse(response);
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/experiences/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Itineraries API
export const itinerariesAPI = {
  getAll: async (params?: { page?: number; limit?: number; region?: string; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.region && params.region !== 'All') queryParams.append('region', params.region);
    if (params?.search) queryParams.append('search', params.search);
    
    const url = `${API_BASE_URL}/itineraries${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/itineraries/${id}`);
    return handleResponse(response);
  },

  create: async (data: FormData | any) => {
    const token = localStorage.getItem('authToken');
    const isFormData = data instanceof FormData;
    const response = await fetch(`${API_BASE_URL}/itineraries`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(!isFormData && { 'Content-Type': 'application/json' })
      },
      body: isFormData ? data : JSON.stringify(data)
    });
    return handleResponse(response);
  },

  update: async (id: string, data: FormData | any) => {
    const token = localStorage.getItem('authToken');
    const isFormData = data instanceof FormData;
    const response = await fetch(`${API_BASE_URL}/itineraries/${id}`, {
      method: 'PUT',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(!isFormData && { 'Content-Type': 'application/json' })
      },
      body: isFormData ? data : JSON.stringify(data)
    });
    return handleResponse(response);
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/itineraries/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Images API
export const imagesAPI = {
  getAll: async (params?: { page?: number; limit?: number; region?: string; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.region && params.region !== 'All') queryParams.append('region', params.region);
    if (params?.search) queryParams.append('search', params.search);
    
    const url = `${API_BASE_URL}/images${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/images/${id}`);
    return handleResponse(response);
  },

  create: async (formData: FormData) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/images`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: formData
    });
    return handleResponse(response);
  },

  update: async (id: string, formData: FormData) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/images/${id}`, {
      method: 'PUT',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: formData
    });
    return handleResponse(response);
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/images/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Updates API
export const updatesAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/updates`);
    return handleResponse(response);
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/updates/${id}`);
    return handleResponse(response);
  },

  create: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/updates`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  update: async (id: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/updates/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/updates/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};