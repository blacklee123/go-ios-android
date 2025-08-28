import { axiosInstance } from '../index'

export function listFile(udid: string, bundleId: string = '', filepath: string = ''): Promise<string[]> {
  if (bundleId !== '') {
    if (filepath === '') {
      filepath = '/Documents'
    }
    return axiosInstance.get(`/ios/${udid}/apps/${bundleId}/fsync/list${filepath}`)
  }
  else {
    if (filepath === '') {
      filepath = '/'
    }
    return axiosInstance.get(`/ios/${udid}/fsync/list${filepath}`)
  }
}
