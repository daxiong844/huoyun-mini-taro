import Taro from '@tarojs/taro'
import { API_HOST, isUseMock } from '../config/global'
import { ApiOptions, HttpMethod } from './types'
import { getMockHandler } from '../mock'

function buildUrl(host: string, path: string, query?: Record<string, any>): string {
  const url = `${host.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
  if (query && Object.keys(query).length > 0) {
    const q = new URLSearchParams()
    Object.entries(query).forEach(([k, v]) => {
      if (v === undefined || v === null) return
      q.append(k, String(v))
    })
    return `${url}?${q.toString()}`
  }
  return url
}

export async function request<T>(method: HttpMethod, path: string, options: ApiOptions = {}): Promise<T> {
  if (isUseMock()) {
    const key = `${method} ${path}`
    const handler = getMockHandler(key)
    if (!handler) {
      throw new Error(`Mock not found for: ${key}`)
    }
    return handler(options) as Promise<T>
  }

  const url = buildUrl(API_HOST, path, options.query)
  const res = await Taro.request<T>({
    url,
    method,
    data: options.body,
    header: options.headers,
  })
  const { statusCode, data } = res
  if (statusCode >= 200 && statusCode < 300) {
    return data as T
  }
  throw new Error(`API ${method} ${path} failed: ${statusCode} ${JSON.stringify(data)}`)
}