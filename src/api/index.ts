import { request } from './http'
import { ApiOptions } from './types'

export const api = {
  get<T>(path: string, options?: ApiOptions) {
    return request<T>('GET', path, options)
  },
  post<T>(path: string, options?: ApiOptions) {
    return request<T>('POST', path, options)
  },
  put<T>(path: string, options?: ApiOptions) {
    return request<T>('PUT', path, options)
  },
  delete<T>(path: string, options?: ApiOptions) {
    return request<T>('DELETE', path, options)
  },
}

export * from './types'