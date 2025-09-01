import type { WebDriverAgentClient } from '@go-ios-android/wda'
import type { WindowSizeResponse } from '@go-ios-android/wda/types'
import type { SelectProps } from 'antd'
import { Select, Space } from 'antd'
import React, { useState } from 'react'
import { IosPoco } from '@/components/IosPoco'
import { UnityPoco } from '@/components/UnityPoco'

interface InspectTabPaneProps {
  udid: string
  windowSize: WindowSizeResponse | undefined
  driver: WebDriverAgentClient
}

const InspectTabPane: React.FC<InspectTabPaneProps> = ({ udid, driver, windowSize }) => {
  const [selectedEngine, setSelectedEngine] = useState<string | undefined>(undefined)

  const onChange: SelectProps['onChange'] = async (value) => {
    setSelectedEngine(value)
  }

  return (
    <Space className="w-full" direction="vertical">
      <Select
        className="w-48"
        value={selectedEngine}
        onChange={onChange}
        options={[
          { value: 'Unity', label: 'Unity' },
          { value: 'Unreal', label: 'Unreal' },
          { value: 'Android', label: 'Android' },
          { value: 'iOS', label: 'iOS' },
        ]}
      />
      { !selectedEngine && <span>请选择engine</span>}
      { selectedEngine === 'iOS' && <IosPoco udid={udid} driver={driver} windowSize={windowSize} />}
      { selectedEngine && selectedEngine !== 'iOS' && <UnityPoco udid={udid} driver={driver} windowSize={windowSize} />}

    </Space>
  )
}
export {
  InspectTabPane,
}
