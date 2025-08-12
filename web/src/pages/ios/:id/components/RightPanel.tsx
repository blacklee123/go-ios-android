import type { WebDriverAgentClient } from '@go-ios-android/wda'
import type { TabsProps } from 'antd'
import { Tabs } from 'antd'
import React from 'react'
import { AppTabPane } from './AppTabPane'
import { ControllTabPane } from './ControllTabPane'
import { SyslogTabPane } from './SyslogTabPane'

interface RightPanelProps {
  udid: string
  driver: WebDriverAgentClient
  tabKey: string
  setTabKey: (key: string) => void
}

const RightPanel: React.FC<RightPanelProps> = ({ udid, driver, tabKey, setTabKey }) => {
  const items: TabsProps['items'] = [
    {
      key: 'controll',
      label: '控制',
      children: <ControllTabPane udid={udid} driver={driver} />,
    },
    {
      key: 'apps',
      label: '应用',
      children: <AppTabPane udid={udid} />,
    },
    {
      key: 'syslog',
      label: '系统日志',
      children: <SyslogTabPane udid={udid} />,
    },
    {
      key: '3',
      label: 'Tab 3',
      children: 'Content of Tab Pane 3',
    },
  ]
  return (
    <Tabs items={items} activeKey={tabKey} onChange={setTabKey} destroyOnHidden />
  )
}

export {
  RightPanel,
}
