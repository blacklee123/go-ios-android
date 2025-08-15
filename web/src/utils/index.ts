import dayjs from 'dayjs'

export function formatDate(date?: dayjs.ConfigType): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}
