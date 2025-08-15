import type { WebDriverAgentClient } from '@go-ios-android/wda'
import type { WindowSizeResponse } from '@go-ios-android/wda/types'
import type { TabsProps } from 'antd'
import { Tabs } from 'antd'
import React from 'react'
import { AppTabPane } from './AppTabPane'
import { ControllTabPane } from './ControllTabPane'
import { InspectTabPane } from './InspectTabPane'
import { ProcessTabPane } from './ProcessTabPane'
import { ScreenshotTabPane } from './ScreenshotTabPane'
import { SyslogTabPane } from './SyslogTabPane'

interface RightPanelProps {
  udid: string
  driver: WebDriverAgentClient
  tabKey: string
  setTabKey: (key: string) => void
  windowSize: WindowSizeResponse | undefined
}

const RightPanel: React.FC<RightPanelProps> = ({ udid, driver, tabKey, setTabKey, windowSize }) => {
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
      key: 'processes',
      label: '进程',
      children: <ProcessTabPane udid={udid} />,
    },
    {
      key: 'syslog',
      label: '日志',
      children: <SyslogTabPane udid={udid} />,
    },
    {
      key: 'screenshot',
      label: '截图',
      children: <ScreenshotTabPane udid={udid} />,
    },
    {
      key: 'inspect',
      label: '控件',
      children: <InspectTabPane udid={udid} driver={driver} windowSize={windowSize} />,
    },
  ]
  return (
    <Tabs
      type="card"
      items={items}
      activeKey={tabKey}
      onChange={setTabKey}
      destroyOnHidden
    />
  )
}

export {
  RightPanel,
}
