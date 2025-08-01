import { axiosInstance } from '../index'
import type { Device } from './types'

export function listIos(): Promise<Device[]> {
  return axiosInstance.get('/ios')
}
