import type { TabsProps } from 'antd'
import { ArrowLeftOutlined, SwapOutlined } from '@ant-design/icons'
import { WebDriverAgentClient } from '@go-ios-android/wda'
import { Divider, Flex, Space, Splitter, Tabs } from 'antd'

import React from 'react'
import { Link, useParams } from 'react-router'
import { AppTabPane } from './components/AppTabPane'
import { ControllTabPane } from './components/ControllTabPane'
import { SyslogTabPane } from './components/SyslogTabPane'
import { useIos } from './hooks'

const Ios: React.FC = () => {
  const params = useParams()
  const udid = params.udid
  const { splitterSizes, setSplitterSizes, splitterLayout, switchSplitterLayout, tabKey, setTabKey } = useIos()
  const driver = new WebDriverAgentClient(`/api/ios/${udid}/wda`)

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
    <Flex vertical className="h-full p-2">
      <Flex justify="space-between">
        <Space>
          <Link to="/">
            <Space>
              <ArrowLeftOutlined />
              <span>返回</span>
            </Space>
          </Link>
          <Divider type="vertical" />
          <span>远程控制</span>
          <span>-</span>
          <Space direction="vertical" size={0}>
            <span className="text-xs">已使用</span>
            <span className="text-xs">已闲置</span>
          </Space>
        </Space>
        <SwapOutlined onClick={switchSplitterLayout} />
      </Flex>
      <Divider />
      <Splitter onResize={setSplitterSizes} layout={splitterLayout}>
        <Splitter.Panel size={splitterSizes[0]} min="20%" max="50%" className="p-2">
          <img
            className="object-contain max-h-full mx-auto"
            alt="这里应该有一张图片"
            src={`/api/ios/${udid}/screenshot`}
          />
        </Splitter.Panel>
        <Splitter.Panel size={splitterSizes[1]} className="p-2">
          <Tabs items={items} activeKey={tabKey} onChange={setTabKey} destroyOnHidden />
        </Splitter.Panel>
      </Splitter>
    </Flex>
  )
}

export {
  Ios,
}
