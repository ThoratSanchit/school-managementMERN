const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'

export function getToken() {
  return localStorage.getItem('authToken') || ''
}

export function removeToken() {
  localStorage.removeItem('authToken')
}

export async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.message || 'Request failed')
  }
  return data
}

export const authApi = {
  login: (credentials) => api('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),
  logout: () => {
    removeToken()
    return Promise.resolve({ message: 'Logged out successfully' })
  }
}

export const studentsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return api(`/students${qs ? `?${qs}` : ''}`)
  }
}

export const teachersApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return api(`/teachers${qs ? `?${qs}` : ''}`)
  }
}

export const classesApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return api(`/classes${qs ? `?${qs}` : ''}`)
  },
  sections: (classId) => api(`/classes/${classId}/sections`)
}

export const attendanceApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return api(`/attendance${qs ? `?${qs}` : ''}`)
  }
}

export const examsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return api(`/exams${qs ? `?${qs}` : ''}`)
  }
}

export const gradesApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return api(`/grades${qs ? `?${qs}` : ''}`)
  }
}

export const feesApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return api(`/fees${qs ? `?${qs}` : ''}`)
  }
}

export const libraryApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return api(`/library${qs ? `?${qs}` : ''}`)
  },
  subjects: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return api(`/library/subjects${qs ? `?${qs}` : ''}`)
  }
}

