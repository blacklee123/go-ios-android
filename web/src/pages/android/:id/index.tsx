import type { TabsProps } from 'antd'
import { useLocalStorageState } from 'ahooks'
import { Splitter, Tabs } from 'antd'
import React from 'react'
import { useParams } from 'react-router'
import { AppTabPane } from './components/AppTabPane'

const Android: React.FC = () => {
  const params = useParams()
  const [sizes, setSizes] = useLocalStorageState<(number | string)[]>(
    'use-local-storage-state-splitter-size',
  {
    defaultValue: (['30%', '70%']),
  },
  )

  const [tabKey, setTabKey] = useLocalStorageState<string>(
    'use-local-storage-state-tab-key',
    {
      defaultValue: 'apps',
    },
  )

  const items: TabsProps['items'] = [
    {
      key: 'apps',
      label: '应用',
      children: <AppTabPane udid={params.udid} />,
    },
    {
      key: '2',
      label: 'Tab 2',
      children: 'Content of Tab Pane 2',
    },
    {
      key: '3',
      label: 'Tab 3',
      children: 'Content of Tab Pane 3',
    },
  ]

  return (
    <Splitter className="h-full" onResize={setSizes}>
      <Splitter.Panel size={sizes[0]} min="20%" max="50%" className="p-2">
        <div className="h-full">
          <img className="max-h-full mx-auto" alt="这里应该有一张图片" src={`/api/android/${params.udid}/screenshot`} />
        </div>
      </Splitter.Panel>
      <Splitter.Panel size={sizes[1]} className="p-2">
        <Tabs items={items} activeKey={tabKey} onChange={setTabKey}>

        </Tabs>
      </Splitter.Panel>
    </Splitter>
  )
}

export {
  Android,
}
