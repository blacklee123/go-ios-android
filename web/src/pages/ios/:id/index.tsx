import { ArrowLeftOutlined, SwapOutlined } from '@ant-design/icons'
import { WebDriverAgentClient } from '@go-ios-android/wda'
import { useRequest } from 'ahooks'

import { Divider, Flex, Space, Splitter } from 'antd'
import React from 'react'
import { Link, useParams } from 'react-router'
import { LeftPanel } from './components/LeftPanel'
import { RightPanel } from './components/RightPanel'
import { useIos } from './hooks'

const Ios: React.FC = () => {
  const params = useParams()
  const udid = params.udid
  const { splitterSizes, setSplitterSizes, splitterLayout, switchSplitterLayout, tabKey, setTabKey } = useIos()
  const driver = new WebDriverAgentClient(`/api/ios/${udid}/wda`)
  const { data: windowSize, loading: windowSizeLoading } = useRequest(() => driver.windowSize())

  return (
    <Flex vertical className="p-2">
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
          <LeftPanel udid={udid} driver={driver} windowSize={windowSize} windowSizeLoading={windowSizeLoading} />
        </Splitter.Panel>
        <Splitter.Panel size={splitterSizes[1]} className="p-2">
          <RightPanel udid={udid} driver={driver} tabKey={tabKey} setTabKey={setTabKey} windowSize={windowSize} />
        </Splitter.Panel>
      </Splitter>
    </Flex>
  )
}

export {
  Ios,
}
