import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  saveSession,
} from './auth-storage'
import type { ApiResponse, LoginResponse } from '../types/api'
import { getTenantCompanyId } from './tenant-storage'

const baseURL = import.meta.env.VITE_API_URL || '/api'

export const api = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

let isRefreshing = false
let refreshQueue: Array<(token: string | null) => void> = []

function processQueue(token: string | null) {
  refreshQueue.forEach((callback) => callback(token))
  refreshQueue = []
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  const tenantCompanyId = getTenantCompanyId()
  if (tenantCompanyId) {
    config.headers['X-Company-Id'] = String(tenantCompanyId)
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    const refreshToken = getRefreshToken()
    if (!refreshToken || originalRequest.url?.includes('/auth/login')) {
      clearSession()
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push((token) => {
          if (!token) {
            reject(error)
            return
          }
          originalRequest.headers.Authorization = `Bearer ${token}`
          resolve(api(originalRequest))
        })
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const { data } = await axios.post<ApiResponse<Omit<LoginResponse, 'user'>>>(
        `${baseURL}/auth/refresh`,
        { refresh_token: refreshToken },
        { headers: { Accept: 'application/json' } },
      )

      const accessToken = data.data.access_token
      const newRefreshToken = data.data.refresh_token
      const user = JSON.parse(localStorage.getItem('margeen_user') || 'null')

      if (user) {
        saveSession(accessToken, newRefreshToken, user)
      }

      processQueue(accessToken)
      originalRequest.headers.Authorization = `Bearer ${accessToken}`
      return api(originalRequest)
    } catch (refreshError) {
      processQueue(null)
      clearSession()
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export async function downloadPdf(invoiceId: number, filename: string): Promise<void> {
  const response = await api.get(`/invoices/${invoiceId}/pdf`, {
    responseType: 'blob',
    headers: { Accept: 'application/pdf' },
  })

  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
