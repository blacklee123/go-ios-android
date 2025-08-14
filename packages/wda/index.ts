import type { AxiosError, AxiosInstance, AxiosResponse } from 'axios'
import type {
  Action,
  ActivateSiriResponse,
  ActiveAppInfoResponse,
  GetPasteboardResponse,
  NullResponse,
  SessionResponse,
  StatusResponse,
  WindowSizeResponse,
} from './types'
import axios from 'axios'
import { Base64 } from 'js-base64'

export class WebDriverAgentClient {
  private readonly client: AxiosInstance
  private currentSessionId: string | null = null
  public defaultCapabilities: Record<string, any> = {}

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    })

    // 添加响应拦截器统一处理数据和错误
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response.data, // 直接返回数据部分
      (error: AxiosError) => {
        // 从错误响应中提取信息
        const errorData = error.response?.data || {}
        const errorMessage
          = errorData.message
            || errorData.error
            || error.message
            || '未知错误'

        // 创建更有意义的错误对象
        const customError = new Error(`请求失败: ${errorMessage}`)
        if (error.response?.status) {
          customError.name = `HTTP_${error.response.status}`
        }

        throw customError
      },
    )
  }

  get sessionId(): string | null {
    return this.currentSessionId
  }

  setDefaultCapabilities(capabilities: Record<string, any>): void {
    this.defaultCapabilities = capabilities
  }

  async _createSession(capabilities: Record<string, any> = {}): Promise<SessionResponse> {
    return this.client.post('/session', { capabilities })
  }

  /**
   * 创建新会话
   * @param capabilities 设备能力配置
   */
  async createSession(capabilities: Record<string, any> = {}): Promise<SessionResponse> {
    const actualCapabilities = Object.keys(capabilities).length > 0
      ? capabilities
      : this.defaultCapabilities

    const sessionResponse = await this._createSession(actualCapabilities)
    this.currentSessionId = sessionResponse.sessionId
    return sessionResponse
  }

  /**
   * 结束当前会话
   */
  async endSession(): Promise<void> {
    if (!this.currentSessionId)
      return

    await this.client.delete(`/session/${this.currentSessionId}`)
    this.currentSessionId = null
  }

  /**
   * 获取 WDA 服务状态
   */
  async getStatus(): Promise<StatusResponse> {
    return this.client.get('/status')
  }

  /**
   * 获取当前活动应用信息
   */
  async activeAppInfo(): Promise<ActiveAppInfoResponse> {
    return this.client.get('/wda/activeAppInfo')
  }

  /**
   * 确保会话存在
   */
  async requiresSession(): Promise<void> {
    if (!this.currentSessionId)
      await this.createSession()
  }

  /**
   * 激活 Siri
   * @param text 要传递给 Siri 的文本
   */
  async siriActivate(text: string): Promise<ActivateSiriResponse> {
    await this.requiresSession()
    return this.client.post(
      `/session/${this.currentSessionId}/wda/siri/activate`,
      { text },
    )
  }

  async setPasteboard(content: string, contentType: string = 'plaintext'): Promise<NullResponse> {
    await this.requiresSession()
    return this.client.post(`/session/${this.currentSessionId}/wda/setPasteboard`, {
      content: Base64.encode(content),
      contentType,
    })
  }

  async getPasteboard(): Promise<GetPasteboardResponse> {
    await this.requiresSession()
    return this.client.post(`/session/${this.currentSessionId}/wda/getPasteboard`)
  }

  async appsLaunch(bundleId: string, params: {
    arguments: string[]
    environment: Record<string, string>
    shouldWaitForQuiescence: boolean
  } = { arguments: [], environment: {}, shouldWaitForQuiescence: false }): Promise<ActiveAppInfoResponse> {
    await this.requiresSession()
    return this.client.post(`/session/${this.currentSessionId}/wda/apps/launch`, {
      bundleId,
      ...params,
    })
  }

  async appsActivate(bundleId: string): Promise<ActiveAppInfoResponse> {
    await this.requiresSession()
    return this.client.post(`/session/${this.currentSessionId}/wda/apps/activate`, {
      bundleId,
    })
  }

  async actions(actions: Action[]): Promise<ActiveAppInfoResponse> {
    await this.requiresSession()
    return this.client.post(`/session/${this.currentSessionId}/actions`, {
      actions,
    })
  }

  async tap(x: number, y: number): Promise<ActiveAppInfoResponse> {
    const action: Action = {
      id: 'finger-0',
      type: 'pointer',
      parameters: { pointerType: 'touch' },
      actions: [
        {
          type: 'pointerMove',
          x,
          y,
        },
        {
          type: 'pointerDown',
        },
        {
          type: 'pointerUp',
        },
      ],
    }
    return this.actions([action])
  }

  async longPress(x: number, y: number, duration: number = 1500): Promise<ActiveAppInfoResponse> {
    const action: Action = {
      id: 'finger-0',
      type: 'pointer',
      parameters: { pointerType: 'touch' },
      actions: [
        {
          type: 'pointerMove',
          x,
          y,
        },
        {
          type: 'pointerDown',
        },
        {
          type: 'pause',
          duration,
        },
        {
          type: 'pointerUp',
        },
      ],
    }
    return this.actions([action])
  }

  async swipe(fromX: number, fromY: number, toX: number, toY: number): Promise<ActiveAppInfoResponse> {
    const action: Action = {
      id: 'finger-0',
      type: 'pointer',
      parameters: { pointerType: 'touch' },
      actions: [
        {
          type: 'pointerMove',
          x: fromX,
          y: fromY,
        },
        { type: 'pointerDown' },
        { type: 'pause', duration: 300 },
        {
          type: 'pointerMove',
          x: toX,
          y: toY,
        },
        { type: 'pause', duration: 10 },
        { type: 'pointerUp' },
      ],
    }
    return this.actions([action])
  }

  async drag(fromX: number, fromY: number, toX: number, toY: number, duration = 500): Promise<ActiveAppInfoResponse> {
    const action: Action = {
      id: 'finger-0',
      type: 'pointer',
      parameters: { pointerType: 'touch' },
      actions: [
        {
          type: 'pointerMove',
          x: fromX,
          y: fromY,
        },
        { type: 'pointerDown' },
        { type: 'pause', duration: 300 },
        {
          type: 'pointerMove',
          x: toX,
          y: toY,
          duration,
        },
        { type: 'pause', duration: 10 },
        { type: 'pointerUp' },
      ],
    }
    return this.actions([action])
  }

  async doubleTap(x: number, y: number): Promise<ActiveAppInfoResponse> {
    await this.requiresSession()
    return this.client.post(`/session/${this.currentSessionId}/wda/doubleTap`, {
      x,
      y,
    })
  }

  async pressButton(buttonName: 'home' | 'volumeUp' | 'volumeDown'): Promise<NullResponse> {
    await this.requiresSession()
    return this.client.post(`/session/${this.currentSessionId}/wda/pressButton`, {
      name: buttonName,
    })
  }

  async locked(): Promise<ActiveAppInfoResponse> {
    await this.requiresSession()
    return this.client.get(`/session/${this.currentSessionId}/wda/locked`)
  }

  async lock(): Promise<ActiveAppInfoResponse> {
    await this.requiresSession()
    return this.client.post(`/session/${this.currentSessionId}/wda/lock`)
  }

  async unlock(): Promise<ActiveAppInfoResponse> {
    await this.requiresSession()
    return this.client.post(`/session/${this.currentSessionId}/wda/unlock`)
  }

  async windowSize(): Promise<WindowSizeResponse> {
    await this.requiresSession()
    return this.client.get(`/session/${this.currentSessionId}/window/size`)
  }
}
