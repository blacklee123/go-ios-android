import type { ColumnsType } from 'antd/es/table'
import type React from 'react'
import type { Process } from '@/api/ios'

import { useRequest } from 'ahooks'
import { Button, Space, Table } from 'antd'
import { listProcess } from '@/api/ios'
import { formatDate } from '@/utils'

interface ProcessTabPaneProps {
  udid: string
}

const ProcessTabPane: React.FC<ProcessTabPaneProps> = ({ udid }) => {
  const { data, loading, refresh } = useRequest(() => listProcess(udid).then(res => res.filter((process: Process) => process.IsApplication)))
  const columns: ColumnsType<Process> = [
    {
      title: 'Name',
      dataIndex: 'Name',
      key: 'Name',
    },
    {
      title: 'Pid',
      dataIndex: 'Pid',
      key: 'Pid',
      align: 'right',
    },
    {
      title: 'RealAppName',
      dataIndex: 'RealAppName',
      key: 'RealAppName',
    },
    {
      title: 'StartDate',
      dataIndex: 'StartDate',
      key: 'StartDate',
      width: 180,
      render: (_, record) => formatDate(record.StartDate),
    },
  ]
  return (
    <Space direction="vertical" className="w-full">
      <Button onClick={refresh} type="primary" className="float-right">刷新</Button>
      <Table dataSource={data} loading={loading} columns={columns} pagination={false} />
    </Space>
  )
}

export { ProcessTabPane }
