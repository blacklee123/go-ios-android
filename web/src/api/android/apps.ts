import type { App } from './types'
import { axiosInstance } from '../index'

export function listApp(udid: string): Promise<App[]> {
  return axiosInstance.get(`/android/${udid}/apps`)
}

export function launchApp(udid: string, bundleId: string): Promise<App[]> {
  return axiosInstance.post(`/android/${udid}/apps/${bundleId}/launch`)
}

export function killApp(udid: string, bundleId: string): Promise<App[]> {
  return axiosInstance.post(`/android/${udid}/apps/${bundleId}/kill`)
}
