export interface WdaResponse<T> {
  value: T
  sessionId: string
}

export interface SessionResponse extends WdaResponse<{
  sdkVersion: string
  device: string
}> {}

export interface StatusResponse extends WdaResponse<{
  message: string
  state: string
  ready: boolean
  os: {
    testmanagerdVersion: number
    name: string
    version: string
    sdkVersion: string
  }
  device: string
  ios?: {
    ip: string
  }
  build: {
    time: string
    version: string
    productBundleIdentifier: string
  }
}> {}

export interface ActivateSiriResponse extends WdaResponse<null> {}

export interface ActiveAppInfoResponse extends WdaResponse<{
  processArguments: {
    env: Record<string, string>
    args: string[]
  }
  name: string
  pid: number
  bundleId: string
}> {}

export interface SetPasteboardResponse extends WdaResponse<null> {}

export interface GetPasteboardResponse extends WdaResponse<string> {}

export interface Actions {
  actions: Action[]
}
export interface Action {
  id: string
  type: 'pointer'
  parameters: Record<string, any>
  actions: TouchAction[]
}

export interface TouchAction {
  type: 'pointerDown' | 'pause' | 'pointerMove' | 'pointerUp'
  duration?: number
  x?: number
  y?: number
}

export interface WindowSizeResponse extends WdaResponse<{
  width: number
  height: number
}> {}
