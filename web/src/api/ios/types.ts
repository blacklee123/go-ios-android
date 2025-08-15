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
  CFBundleIdentifier: string
  CFBundleName: string
  CFBundleShortVersionString: string
  CFBundleVersion: string
  Icon: string
}

export interface Process {
  IsApplication: boolean
  Name: string
  Pid: number
  RealAppName: string
  StartDate: string
}
