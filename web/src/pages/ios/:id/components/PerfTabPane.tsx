import { SyncOutlined } from '@ant-design/icons'
import { useRequest } from 'ahooks'
import { Avatar, Button, Col, Row, Select, Space } from 'antd'
import React, { useState } from 'react'
import { listApp } from '@/api/ios'
import { SysMemChart } from './charts/SysMemChart'

interface PerfTabPaneProps {
  udid: string
}

const PerfTabPane: React.FC<PerfTabPaneProps> = ({ udid }) => {
  const [running, setRunning] = useState<boolean>(false)
  const { data: apps = [], loading } = useRequest(() => listApp(udid))

  function handleStart() {
    setRunning(true)
  }

  function handleStop() {
    setRunning(false)
  }

  return (
    <Space direction="vertical" className="w-full">
      <Row gutter={[24, 24]}>
        <Col span={12}>
          <Select
            className="w-full"
            loading={loading}
            showSearch
            allowClear
            options={apps.map(app => ({
              label: (
                <Space>
                  <Avatar size={16} src={`data:image/png;base64,${app.Icon}`}></Avatar>
                  <span>{ app.CFBundleName}</span>
                  <span>{ app.CFBundleIdentifier}</span>

                </Space>
              ),
              value: app.CFBundleIdentifier,
            }))}
          />
        </Col>
        <Col span={12}>
          <Space>
            {
              !running
                ? <Button type="primary" onClick={handleStart}>Start</Button>
                : <Button danger onClick={handleStop} icon={<SyncOutlined spin />}>Stop</Button>
            }
            <Button>Clear</Button>
          </Space>
        </Col>
      </Row>
      <Row>
        <SysMemChart data={[]} />
      </Row>
    </Space>
  )
}

export {
  PerfTabPane,
}
