import type { App } from './types'
import { axiosInstance } from '../index'

export function listApp(udid: string, type: string = 'user'): Promise<App[]> {
  return axiosInstance.get(`/ios/${udid}/apps_with_icon`, { params: { type } })
}

export function launchApp(udid: string, bundleId: string): Promise<App[]> {
  return axiosInstance.post(`/ios/${udid}/apps/${bundleId}/launch`)
}

export function killApp(udid: string, bundleId: string): Promise<App[]> {
  return axiosInstance.post(`/ios/${udid}/apps/${bundleId}/kill`)
}

export function uninstallApp(udid: string, bundleId: string): Promise<App[]> {
  return axiosInstance.post(`/ios/${udid}/apps/${bundleId}/uninstall`)
}
