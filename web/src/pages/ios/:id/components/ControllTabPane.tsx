import type { WebDriverAgentClient } from '@go-ios-android/wda'
import { Button, Card, Col, Form, Input, Row, Typography } from 'antd'
import React, { useState } from 'react'

interface ControllTabPaneProps {
  udid: string
  driver: WebDriverAgentClient
}

const ControllTabPane: React.FC<ControllTabPaneProps> = ({ driver }) => {
  const [siriText, setSiriText] = useState('')
  async function siriActivate() {
    await driver.activateSiri(siriText)
  }

  return (
    <Row gutter={[24, 24]}>
      <Col span={12}>
        <Card
          title="Siri指令"
          actions={[
            <Button key="send" size="small" type="primary" onClick={siriActivate}>发送</Button>,
          ]}
        >
          <Input placeholder="请输入siri指令 如：打开微信" value={siriText} onChange={e => setSiriText(e.target.value)} />
        </Card>
      </Col>
      <Col span={12}>
        <Card
          className="h-full"
          title="远程WDA"
        >
          <Typography.Text code copyable>http://192.168.2.103:64383</Typography.Text>
        </Card>
      </Col>
      <Col span={12}>
        <Card
          className="h-full"
          title="剪切板操作"

          actions={[
            <Button key="send" size="small" type="primary">发送到剪切板</Button>,
            <Button key="get" size="small" type="primary">获取剪切板文本</Button>,

          ]}
        >
          <Input.TextArea />
        </Card>
      </Col>
      <Col span={12}>
        <Card
          title="模拟定位"

          actions={[
            <Button key="send" size="small" type="primary">开始模拟</Button>,
            <Button key="reset" size="small" type="primary">恢复定位</Button>,
          ]}
        >
          <Form>
            <Form.Item label="经度"><Input /></Form.Item>
            <Form.Item label="纬度："><Input /></Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  )
}
export {
  ControllTabPane,
}
