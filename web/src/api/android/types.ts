export interface Device {
  temperature: number
  voltage: number
  level: number
  cpu: string
  manufacturer: string
  model: string
  name: string
  platform: 'android' | 'ios'
  isHm: number
  size: string
  udId: string
  version: string
}

export interface App {

}
