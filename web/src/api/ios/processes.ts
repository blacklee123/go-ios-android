import type { Process } from './types'
import { axiosInstance } from '../index'

export function listProcess(udid: string): Promise<Process[]> {
  return axiosInstance.get(`/ios/${udid}/processes`)
}
