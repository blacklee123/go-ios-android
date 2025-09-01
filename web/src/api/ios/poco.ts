import { axiosInstance } from '../index'

export interface PocoNode {
  name: string
  payload: {
    anchorPoint: [ x: number, y: number ]
    name: string
    pos: [ x: number, y: number ]
    scale: [ x: number, y: number ]
    size: [ x: number, y: number ]
    type: string
    visible: boolean
    zOrders: {
      global: number
      local: number
    }
  }
  children: PocoNode[]
}

export function pocoDump(udid: string, port: number): Promise<PocoNode> {
  return axiosInstance.get(`/ios/${udid}/poco/${port}/dump`)
}
