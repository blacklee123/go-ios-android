import List from 'rc-virtual-list'
import React, { useEffect, useState } from 'react'

interface SyslogTabPaneProps {
  udid: string
}

const MAX_LOG_LENGTH = 100

const SyslogTabPane: React.FC<SyslogTabPaneProps> = ({ udid }) => {
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    const es = new EventSource(`/api/ios/${udid}/syslog`)
    es.onmessage = (event) => {
      setLogs(prevLogs => [...prevLogs, event.data].slice(-MAX_LOG_LENGTH))
    }

    return () => {
      es.close()
    }
  }, []) // 依赖项确保 UDID 变化时重建连接

  return (
    <List
      data={logs}
      height={400}
      itemHeight={30}
      itemKey={index => index.toString()}
    >
      {(log, index) => <div key={index}>{log}</div>}
    </List>
  )
}

export { SyslogTabPane }
