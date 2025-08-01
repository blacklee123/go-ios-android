import type { Device } from './types'
import { axiosInstance } from '../index'

export function listIos(): Promise<Device[]> {
  return axiosInstance.get('/ios')
}
