import NProgress from 'nprogress'
import { createAxiosInstance } from '@/utils/api.service'
import 'nprogress/nprogress.css'

export * from './ios'

NProgress.configure({
  showSpinner: false,
  minimum: 0.2,
  easing: 'swing',
  speed: 1000,
  trickleSpeed: 0.2,
})

let loadingNum = 0

function startLoading() {
  if (loadingNum === 0)
    NProgress.start()

  loadingNum += 1
}
function endLoading() {
  loadingNum -= 1
  if (loadingNum <= 0)
    NProgress.done()
}

export const route_prefix = './api'

export const axiosInstance = createAxiosInstance({
  baseURL: route_prefix,
  timeout: 30000,
  isRest: true,
  startLoading: () => startLoading(),
  endLoading: () => endLoading(),
})
