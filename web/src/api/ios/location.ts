import { axiosInstance } from '../index'

export function setLocation(udid: string, data: { lat: number, lon: number }): Promise<void> {
  return axiosInstance.post(`/ios/${udid}/location`, data)
}

export function resetLocation(udid: string): Promise<void> {
  return axiosInstance.post(`/ios/${udid}/location/reset`)
}
