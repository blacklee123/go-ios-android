import type { ColumnsType } from 'antd/es/table'
import type { App } from '@/api/ios'
import { useRequest } from 'ahooks'
import { Avatar, Button, Space, Table } from 'antd'
import React from 'react'
import { launchApp, listApp } from '@/api/ios'

interface AppTabPaneProps {
  udid: string
}

const AppTabPane: React.FC<AppTabPaneProps> = ({ udid }) => {
  const { data: apps, loading } = useRequest(() => listApp(udid))
  const columns: ColumnsType<App> = [
    {
      title: 'Icon',
      dataIndex: 'Icon',
      key: 'Icon',
      render: (_, record) => <Avatar src={`data:image/png;base64,${record.Icon}`} />,
    },
    {
      title: 'CFBundleIdentifier',
      dataIndex: 'CFBundleIdentifier',
      key: 'CFBundleIdentifier',
    },
    {
      title: 'CFBundleName',
      dataIndex: 'CFBundleName',
      key: 'CFBundleName',
    },
    {
      title: 'CFBundleShortVersionString',
      dataIndex: 'CFBundleShortVersionString',
      key: 'CFBundleShortVersionString',
    },
    {
      title: 'CFBundleVersion',
      dataIndex: 'CFBundleVersion',
      key: 'CFBundleVersion',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space.Compact size="small">
          <Button onClick={() => onLaunch(record)}>打开</Button>
          <Button danger>卸载</Button>
        </Space.Compact>
      ),
    },
  ]

  async function onLaunch(record: App) {
    await launchApp(udid, record.CFBundleIdentifier)
  }

  return (
    <Table loading={loading} dataSource={apps} columns={columns}>

    </Table>
  )
}
export {
  AppTabPane,
}
