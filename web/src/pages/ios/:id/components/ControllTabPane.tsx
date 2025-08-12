import type { WebDriverAgentClient } from '@go-ios-android/wda'
import type { InputNumberProps } from 'antd'
import { Button, Card, Col, Form, Input, InputNumber, Row, Typography } from 'antd'
import React, { useState } from 'react'
import { resetLocation, setLocation } from '@/api/ios'

const SiriCard: React.FC<{ driver: WebDriverAgentClient }> = ({ driver }) => {
  const [loading, setLoading] = useState(false)
  const [siriText, setSiriText] = useState('')
  async function siriActivate() {
    setLoading(true)
    try {
      await driver.siriActivate(siriText)
    }
    finally {
      setTimeout(() => {
        setLoading(false)
      }, 1000)
    }
  }
  return (
    <Card
      title="Siri指令"
      actions={[
        <Button
          loading={loading}
          key="send"
          size="small"
          type="primary"
          onClick={siriActivate}
        >
          发送
        </Button>,
      ]}
    >
      <Input
        placeholder="请输入siri指令 如：打开微信"
        value={siriText}
        allowClear
        onChange={e => setSiriText(e.target.value)}
      />
    </Card>
  )
}

const WdaCard: React.FC<{ udid: string }> = ({ udid }) => {
  return (
    <Card
      className="h-full"
      title="远程WDA"
    >
      <Typography.Text code copyable>{`${location.origin}/api/ios/${udid}/wda`}</Typography.Text>
      <Typography.Text code copyable>{`${location.origin}/api/ios/${udid}/wda/status`}</Typography.Text>
    </Card>
  )
}

const ClipBoardCard: React.FC<{ driver: WebDriverAgentClient }> = ({ driver }) => {
  const [setClipBoardLoading, setSetClipBoardLoading] = useState(false)
  const [getClipBoardLoading, setGetClipBoardLoading] = useState(false)
  const [text, setText] = useState('')
  async function setClipBoard() {
    setSetClipBoardLoading(true)
    try {
      const activeAppInfo = await driver.activeAppInfo()
      await driver.siriActivate('open WebDriverAgentRunner-Runner')
      setTimeout(async () => {
        try {
          await driver.setPasteboard(text)
          await driver.appsActivate(activeAppInfo.value.bundleId)
        }
        finally {
          setSetClipBoardLoading(false)
        }
      }, 3000)
    }
    catch {
      setSetClipBoardLoading(false)
    }
  }

  async function getClipBoard() {
    setGetClipBoardLoading(true)
    try {
      const activeAppInfo = await driver.activeAppInfo()
      await driver.siriActivate('open WebDriverAgentRunner-Runner')
      setTimeout(async () => {
        try {
          const res = await driver.getPasteboard()
          setText(res.value)
          driver.appsActivate(activeAppInfo.value.bundleId)
        }
        finally {
          setGetClipBoardLoading(false)
        }
      }, 3000)
    }
    catch {
      setGetClipBoardLoading(false)
    }
  }
  return (
    <Card
      className="h-full"
      title="剪切板操作"

      actions={[
        <Button
          key="send"
          size="small"
          type="primary"
          loading={setClipBoardLoading}
          onClick={setClipBoard}
        >
          发送到剪切板
        </Button>,
        <Button
          key="get"
          size="small"
          type="primary"
          loading={getClipBoardLoading}
          onClick={getClipBoard}
        >
          获取剪切板文本
        </Button>,

      ]}
    >
      <Input.TextArea
        value={text}
        onChange={e => setText(e.target.value)}
        allowClear
      />
    </Card>
  )
}

const LocationCard: React.FC<{ udid: string }> = ({ udid }) => {
  const [lat, setLat] = useState<number>(0.000000)
  const [lon, setLon] = useState<number>(0.000000)

  const onLatChange: InputNumberProps['onChange'] = (value) => {
    console.log('changed', value)
    setLat(value)
  }

  const onLonChange: InputNumberProps['onChange'] = (value) => {
    console.log('changed', value)
    setLon(value)
  }

  async function onSetLocation() {
    await setLocation(udid, { lat, lon })
  }

  async function onResetLocation() {
    await resetLocation(udid)
  }

  return (
    <Card
      title="模拟定位"
      actions={[
        <Button
          key="send"
          size="small"
          type="primary"
          onClick={onSetLocation}
        >
          开始模拟
        </Button>,
        <Button
          key="reset"
          size="small"
          type="primary"
          onClick={onResetLocation}
        >
          恢复定位
        </Button>,
      ]}
    >
      <Form>
        <Form.Item label="经度">
          <InputNumber
            className="w-full"
            value={lon}
            min={-180}
            max={180}
            precision={6}
            addonAfter="°"
            onChange={onLonChange}
          />
        </Form.Item>
        <Form.Item label="纬度">
          <InputNumber
            className="w-full"
            value={lat}
            min={-90}
            max={90}
            precision={6}
            addonAfter="°"
            onChange={onLatChange}
          />
        </Form.Item>
      </Form>
    </Card>
  )
}

interface ControllTabPaneProps {
  udid: string
  driver: WebDriverAgentClient
}

const ControllTabPane: React.FC<ControllTabPaneProps> = ({ driver, udid }) => {
  return (
    <Row gutter={[24, 24]}>
      <Col span={12}>
        <SiriCard driver={driver} />
      </Col>
      <Col span={12}>
        <WdaCard udid={udid} />
      </Col>
      <Col span={12}>
        <ClipBoardCard driver={driver} />
      </Col>
      <Col span={12}>
        <LocationCard udid={udid} />
      </Col>
    </Row>
  )
}

export {
  ControllTabPane,
}
