export interface StatusResponse {
  value: {
    message: string
    state: string
    os: {
      name: string
      version: string
    }
    ios?: {
      simulatorVersion?: string
    }
    build: {
      time: string
    }
  }
}

export interface SessionResponse {
  sessionId: string
  capabilities: Record<string, any>
}

export interface ActivateSiriResponse {
  value: null
  sessionId?: string
}
