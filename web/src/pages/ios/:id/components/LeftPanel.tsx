import type { WebDriverAgentClient } from '@go-ios-android/wda'
import { HomeOutlined, InfoCircleOutlined, PoweroffOutlined } from '@ant-design/icons'
import { useRequest } from 'ahooks'
import { Button, Card, Flex, Space, Spin } from 'antd'
import React, { useRef } from 'react'

interface LeftPanelProps {
  udid: string
  driver: WebDriverAgentClient
}

const MOVE_THRESHOLD = 5 // 滑动阈值（设备像素）

const LeftPanel: React.FC<LeftPanelProps> = ({ udid, driver }) => {
  const { data: windowSize, loading: windowSizeLoading } = useRequest(() => driver.windowSize())
  const imgRef = useRef<HTMLImageElement>(null)

  // 使用ref存储状态
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isLongPressRef = useRef(false)
  const startPointRef = useRef({ x: 0, y: 0 })
  const isSwipingRef = useRef(false)

  const calculateDeviceCoordinates = (event: React.MouseEvent) => {
    if (!imgRef.current)
      return { x: 0, y: 0 }

    const img = imgRef.current
    const rect = img.getBoundingClientRect()
    const scaleX = windowSize!.value.width / rect.width
    const scaleY = windowSize!.value.height / rect.height

    const x = (event.clientX - rect.left) * scaleX
    const y = (event.clientY - rect.top) * scaleY

    return { x, y }
  }

  const _onMouseDown = async (event: React.MouseEvent) => {
    const { x, y } = calculateDeviceCoordinates(event)
    startPointRef.current = { x, y }

    // 重置状态
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
    }
    isLongPressRef.current = false
    isSwipingRef.current = false

    // 设置长按定时器
    longPressTimerRef.current = setTimeout(() => {
      driver.longPress(x, y)
      isLongPressRef.current = true
    }, 1000)
  }

  const _onMouseMove = (event: React.MouseEvent) => {
    // 如果已经触发了长按，不再处理移动事件
    if (isLongPressRef.current)
      return

    const { x, y } = calculateDeviceCoordinates(event)
    const dx = Math.abs(x - startPointRef.current.x)
    const dy = Math.abs(y - startPointRef.current.y)

    // 检查是否达到滑动阈值
    if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
      // 达到滑动阈值，标记为滑动状态
      isSwipingRef.current = true

      // 取消长按定时器
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
    }
  }

  const _onMouseUp = (event: React.MouseEvent) => {
    // 清除长按定时器
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    // 如果已经触发了长按，不再处理后续操作
    if (isLongPressRef.current) {
      isLongPressRef.current = false
      return
    }

    const { x, y } = calculateDeviceCoordinates(event)

    if (isSwipingRef.current) {
      // 触发滑动操作
      driver.swipe(startPointRef.current.x, startPointRef.current.y, x, y)
    }
    else {
      // 触发点击操作
      driver.tap(x, y)
    }

    // 重置滑动状态
    isSwipingRef.current = false
  }

  const _onMouseLeave = () => {
    // 清除长按定时器
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    // 重置状态
    isLongPressRef.current = false
    isSwipingRef.current = false
  }

  async function pressHome() {
    await driver.pressButton('home')
  }

  async function onPower() {
    const locked = await driver.locked()
    if (locked.value) {
      await driver.unlock()
    }
    else {
      await driver.lock()
    }
  }

  return (
    <Card title="设备控制" extra={<InfoCircleOutlined />}>
      <Spin spinning={windowSizeLoading}>
        <Flex gap={8}>
          <Flex vertical gap={8}>
            <img
              ref={imgRef}
              className="object-contain max-h-full mx-auto cursor-pointer"
              alt="设备屏幕"
              src={`/api/ios/${udid}/wdavideo/`}
              draggable="false"
              onMouseDown={_onMouseDown}
              onMouseMove={_onMouseMove}
              onMouseUp={_onMouseUp}
              onMouseLeave={_onMouseLeave}
            />
            <Button block icon={<HomeOutlined />} onClick={pressHome}></Button>
          </Flex>
          <Space.Compact direction="vertical">
            <Button icon={<InfoCircleOutlined />} />
            <Button icon={<InfoCircleOutlined />} />
            <Button icon={<InfoCircleOutlined />} />
            <Button icon={<PoweroffOutlined />} onClick={onPower} />
          </Space.Compact>
        </Flex>
      </Spin>
    </Card>
  )
}

export {
  LeftPanel,
}
