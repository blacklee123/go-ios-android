import type { WebDriverAgentClient } from '@go-ios-android/wda'
import { InfoCircleOutlined } from '@ant-design/icons'
import { useRequest } from 'ahooks'
import { Button, Card, Flex, Space, Spin } from 'antd'
import React, { useRef } from 'react' // 添加 useState 和 useRef

interface LeftPanelProps {
  udid: string
  driver: WebDriverAgentClient
}

const LeftPanel: React.FC<LeftPanelProps> = ({ udid, driver }) => {
  let loop = null
  let time = 0
  let moveX = 0
  let moveY = 0
  let isLongPress = false

  const { data: windowSize, loading: windowSizeLoading } = useRequest(() => driver.windowSize())
  // 使用 ref 获取图片元素
  const imgRef = useRef<HTMLImageElement>(null)

  // 计算设备坐标
  const calculateDeviceCoordinates = (event: React.MouseEvent) => {
    if (!imgRef.current)
      return { x: 0, y: 0 }

    const img = imgRef.current
    // 获取图片实际显示尺寸和位置
    const rect = img.getBoundingClientRect()

    // 计算缩放比例
    const scaleX = windowSize!.value.width / rect.width
    const scaleY = windowSize!.value.height / rect.height

    // 计算相对于图片的坐标
    const x = (event.clientX - rect.left) * scaleX
    const y = (event.clientY - rect.top) * scaleY

    return { x, y }
  }

  // 鼠标按下事件
  const _onMouseDown = async (event: React.MouseEvent) => {
    const { x, y } = calculateDeviceCoordinates(event)
    moveX = x
    moveY = y
    clearInterval(loop)
    loop = setInterval(() => {
      time += 500
      if (time >= 1000 && isLongPress === false) {
        console.log('longPress', x, y)
        driver.longPress(x, y)
        isLongPress = true
      }
    }, 500)
  }

  // 鼠标释放事件
  const _onMouseUp = (event: React.MouseEvent) => {
    clearInterval(loop)
    time = 0
    const { x, y } = calculateDeviceCoordinates(event)
    if (moveX === x && moveY === y) {
      if (!isLongPress) {
        console.log('tap', x, y)
        driver.tap(x, y)
      }
    }
    else {
      console.log('swipe', moveX, moveY, x, y)
      driver.swipe(moveX, moveY, x, y)
    }
    isLongPress = false
  }

  // 鼠标离开事件
  const _onMouseLeave = () => {
    clearInterval(loop)
    isLongPress = false
  }

  return (
    <Card title="设备控制" extra={<InfoCircleOutlined />}>
      <Spin spinning={windowSizeLoading}>
        <Flex>
          <Flex vertical>
            <img
              ref={imgRef} // 添加 ref 引用
              className="object-contain max-h-full mx-auto cursor-pointer" // 添加指针样式
              alt="设备屏幕"
              src={`/api/ios/${udid}/wdavideo/`}
              // 绑定事件处理器
              onMouseDown={_onMouseDown}
              onMouseUp={_onMouseUp}
              onMouseLeave={_onMouseLeave}
            />
            <Button>按钮</Button>
          </Flex>
          <Space direction="vertical">
            <Button icon={<InfoCircleOutlined />} />
            <Button icon={<InfoCircleOutlined />} />
            <Button icon={<InfoCircleOutlined />} />
          </Space>
        </Flex>
      </Spin>
    </Card>
  )
}

export {
  LeftPanel,
}
