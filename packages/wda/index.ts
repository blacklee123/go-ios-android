import type { AxiosInstance, AxiosResponse } from 'axios'
import type { ActivateSiriResponse, SessionResponse, StatusResponse } from './types'
import axios from 'axios'

export class WebDriverAgentClient {
  private readonly client: AxiosInstance
  private currentSessionId: string | null = null

  public defaultCapabilities: Record<string, any> = {
  }

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  get sessionId(): string | null {
    return this.currentSessionId
  }

  setDefaultCapabilities(capabilities: Record<string, any>): void {
    this.defaultCapabilities = capabilities
  }

  /**
   * 创建新会话
   * @param capabilities 设备能力配置
   */
  async createSession(capabilities: Record<string, any> = {}): Promise<SessionResponse> {
    console.debug('创建会话')
    try {
      // 使用提供的参数或默认配置
      const actualCapabilities = Object.keys(capabilities).length > 0
        ? capabilities
        : this.defaultCapabilities

      const response: AxiosResponse<SessionResponse> = await this.client.post('/session', {
        capabilities: {
          alwaysMatch: actualCapabilities,
          firstMatch: [{}],
        },
      })

      this.currentSessionId = response.data.sessionId
      return response.data
    }
    catch (error) {
      throw new Error(`创建会话失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 结束当前会话
   */
  async endSession(): Promise<void> {
    if (!this.currentSessionId) {
      return
    }

    try {
      await this.client.delete(`/session/${this.currentSessionId}`)
      this.currentSessionId = null
    }
    catch (error) {
      throw new Error(`结束会话失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 获取 WDA 服务状态
   */
  async getStatus(): Promise<StatusResponse> {
    try {
      const response: AxiosResponse<StatusResponse> = await this.client.get('/status')
      return response.data
    }
    catch (error) {
      throw new Error(`获取状态失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 激活 Siri
   * @param sessionId 当前会话 ID (可选)
   */

  async requiresSession(): Promise<void> {
    if (!this.currentSessionId) {
      await this.createSession()
    }
  }

  async activateSiri(text: string): Promise<ActivateSiriResponse> {
    await this.requiresSession()
    try {
      const response: AxiosResponse<ActivateSiriResponse> = await this.client.post(
        `/session/${this.currentSessionId}/wda/siri/activate`,
        {
          text,
        },
      )
      return response.data
    }
    catch (error) {
      throw new Error(`激活 Siri 失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}
