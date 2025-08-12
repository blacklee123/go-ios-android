import { InfoCircleOutlined } from '@ant-design/icons'
import { Button, Card, Flex, Space } from 'antd'
import React from 'react'

interface LeftPanelProps {
  udid: string
}

const LeftPanel: React.FC<LeftPanelProps> = ({ udid }) => {
  function _onMouseUp(event) {
    console.log('mouseup', event)
  }
  function _onMouseDown(event) {
    console.log('mousedown', event)
  }
  function _onMouseLeave(event) {
    console.log('mouseleave', event)
  }

  return (
    <Card title="Default size card" extra={<InfoCircleOutlined />}>
      <Flex>
        <Flex vertical>
          <img
            className="object-contain max-h-full mx-auto"
            alt="这里应该有一张图片"
            src={`/api/ios/${udid}/wdavideo/`}
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
