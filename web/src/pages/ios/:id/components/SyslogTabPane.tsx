import { SyncOutlined } from '@ant-design/icons'
import { Button, Input, Space } from 'antd'
import List from 'rc-virtual-list'
import React, { useEffect, useRef, useState } from 'react'

interface SyslogTabPaneProps {
  udid: string
}

const MAX_LOG_LENGTH = 1000

const SyslogTabPane: React.FC<SyslogTabPaneProps> = ({ udid }) => {
  const [running, setRunning] = useState<boolean>(false)
  const [filter, setFilter] = useState<string>('')
  const [logs, setLogs] = useState<string[]>([])
  const esRef = useRef<EventSource | null>(null) // 使用 ref 替代局部变量

  function handleSearch() {
    if (esRef.current) {
      esRef.current.close()
    }

    // 创建新连接并保存到 ref
    esRef.current = new EventSource(`/api/ios/${udid}/syslog?filter=${filter}`)
    esRef.current.onmessage = (event) => {
      setLogs(prevLogs => [...prevLogs, event.data].slice(-MAX_LOG_LENGTH))
    }
    setRunning(true)
  }

  // 高亮关键词的渲染函数
  const renderHighlightedLog = (log: string) => {
    // 安全分割字符串（避免使用正则替换 HTML）
    const parts = log.split(/(Notice|Error)/g)

    return parts.map((part, index) => {
      if (part === 'Notice') {
        return <span key={index} className="text-primary">{part}</span>
      }
      else if (part === 'Error') {
        return <span key={index} className="text-red-400">{part}</span>
      }
      else {
        return part
      }
    })
  }

  function handleStop() {
    if (esRef.current) {
      esRef.current.close()
      esRef.current = null
    }
    setRunning(false)
  }

  useEffect(() => {
    return () => {
      if (esRef.current) {
        esRef.current.close()
      }
    }
  }, [])

  return (
    <Space className="w-full" direction="vertical">
      <Space>
        <Input value={filter} onChange={e => setFilter(e.target.value)} className="w-160" />
        {
          !running
            ? <Button type="primary" onClick={handleSearch}>Search</Button>
            : <Button danger onClick={handleStop} icon={<SyncOutlined spin />}>Stop</Button>
        }
        <Button onClick={() => setLogs([])}>Clear</Button>
      </Space>
      <List
        className="bg-gray-800 text-white p-2"
        data={logs}
        height={480}
        itemHeight={30}
        itemKey={index => index.toString()}
      >
        {(log, index) => <div key={index}>{renderHighlightedLog(log)}</div>}
      </List>
    </Space>
  )
}

export { SyslogTabPane }
