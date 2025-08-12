import { InfoCircleOutlined } from '@ant-design/icons'
import { Button, Card, Flex, Space } from 'antd'
import React, { useRef, useState } from 'react' // 添加 useState 和 useRef

interface LeftPanelProps {
  udid: string
}

const LeftPanel: React.FC<LeftPanelProps> = ({ udid }) => {
  // 使用 ref 获取图片元素
  const imgRef = useRef<HTMLImageElement>(null)
  // 跟踪鼠标按下状态
  const [isMouseDown, setIsMouseDown] = useState(false)

  // 计算设备坐标
  const calculateDeviceCoordinates = (event: React.MouseEvent) => {
    if (!imgRef.current)
      return { x: 0, y: 0 }

    const img = imgRef.current
    // 获取图片实际显示尺寸和位置
    const rect = img.getBoundingClientRect()

    // 计算缩放比例
    const scaleX = img.naturalWidth / rect.width
    const scaleY = img.naturalHeight / rect.height

    // 计算相对于图片的坐标
    const x = (event.clientX - rect.left) * scaleX
    const y = (event.clientY - rect.top) * scaleY

    return { x, y }
  }

  // 鼠标按下事件
  const _onMouseDown = (event: React.MouseEvent) => {
    setIsMouseDown(true)
    const { x, y } = calculateDeviceCoordinates(event)
    console.log('mousedown', { x, y })
    // 这里添加发送操作到设备的代码
  }

  // 鼠标释放事件
  const _onMouseUp = (event: React.MouseEvent) => {
    setIsMouseDown(false)
    const { x, y } = calculateDeviceCoordinates(event)
    console.log('mouseup', { x, y })
    // 这里添加发送操作到设备的代码
  }

  // 鼠标移动事件
  const _onMouseMove = (event: React.MouseEvent) => {
    if (!isMouseDown)
      return

    const { x, y } = calculateDeviceCoordinates(event)
    console.log('mousemove', { x, y })
    // 这里添加发送操作到设备的代码（如拖动操作）
  }

  // 鼠标离开事件
  const _onMouseLeave = () => {
    setIsMouseDown(false)
    console.log('mouseleave')
  }

  return (
    <Card title="设备控制" extra={<InfoCircleOutlined />}>
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
            onMouseMove={_onMouseMove}
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
    </Card>
  )
}

export {
  LeftPanel,
}
