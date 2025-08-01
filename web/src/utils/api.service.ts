import type { AxiosError, AxiosInstance, AxiosResponse } from 'axios'
import { notification } from 'antd'

import axios from 'axios'
import qs from 'qs'

export interface ApiResponse<T = any> {
  code: number
  message: string
  data?: T
}

export interface PageData<T = any> {
  page: number
  page_size: number
  total: number
  data: T[]
}

export function createAxiosInstance({
  baseURL = '',
  timeout = 30000,
  startLoading = () => { },
  endLoading = () => { },
}: {
  baseURL?: string
  timeout?: number
  isRest?: boolean
  startLoading?: () => void
  endLoading?: () => void
}): AxiosInstance {
  const axiosInstance = axios.create({
    baseURL,
    withCredentials: true,
    timeout,
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: 'repeat' })
    },
  })

  axiosInstance.interceptors.request.use(
    (config) => {
      // 加载进度条
      startLoading()
      return config
    },
    (error) => {
      return Promise.reject(error)
    },
  )

  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
      endLoading()
      return response.data
    },
    (error: AxiosError<ApiResponse>) => {
      console.error(error)
      const status = error.response?.status
      let message = error.response?.data.message || ''
      switch (status) {
        case 403:
          message = `拒绝访问${message}`
          break
        case 404:
          message = `请求地址错误${message}`
          break
        case 500:
          message = `服务器故障${message}`
          break
        default:
          message = `网络连接故障${message}`
      }
      notification.error({
        message: '服务器故障',
        description: message,
      })
      return Promise.reject(error)
    },
  )

  return axiosInstance
}
