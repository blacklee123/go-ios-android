import type { SystemMemData } from '@/api/ios/perfTypes'
import { SyncOutlined } from '@ant-design/icons'
import { useRequest } from 'ahooks'
import { Avatar, Button, Col, Row, Select, Space } from 'antd'
import React, { useEffect, useRef, useState } from 'react'
import { listApp } from '@/api/ios'
import { SysMemChart } from './charts/SysMemChart'

interface PerfTabPaneProps {
  udid: string
}

const PerfTabPane: React.FC<PerfTabPaneProps> = ({ udid }) => {
  const [running, setRunning] = useState<boolean>(false)
  const { data: apps = [], loading } = useRequest(() => listApp(udid))
  const esRef = useRef<EventSource | null>(null)
  const [systemMemData, setSystemMemData] = useState<SystemMemData[]>([])

  function handleStart() {
    if (esRef.current) {
      esRef.current.close()
    }
    esRef.current = new EventSource(`/api/ios/${udid}/perf/sse`)
    esRef.current.addEventListener('sys_mem', (event) => {
      const data: SystemMemData = JSON.parse(event.data)
      console.log('data', data)
      setSystemMemData(prevData => [...prevData, data])
    })
    setRunning(true)
  }

  function handleStop() {
    if (esRef.current) {
      esRef.current.close()
      esRef.current = null
    }
    setRunning(false)
  }

  function handleClear() {
    setSystemMemData([])
  }

  useEffect(() => {
    return () => {
      if (esRef.current) {
        esRef.current.close()
      }
    }
  }, [])

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
            <Button onClick={handleClear}>Clear</Button>
          </Space>
        </Col>
      </Row>
      <Row>
        <SysMemChart data={systemMemData} />
      </Row>
    </Space>
  )
}

export {
  PerfTabPane,
}
