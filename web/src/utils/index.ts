import dayjs from 'dayjs'

export * from './wda'

export function formatDate(date?: dayjs.ConfigType): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}
