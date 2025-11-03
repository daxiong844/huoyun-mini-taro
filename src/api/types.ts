export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export interface ApiOptions {
  query?: Record<string, any>
  body?: any
  headers?: Record<string, string>
}