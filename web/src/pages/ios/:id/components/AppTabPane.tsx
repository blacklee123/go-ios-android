import type { InputRef, TableColumnsType, TableColumnType, TabsProps } from 'antd'
import type { FilterDropdownProps } from 'antd/es/table/interface'
import type { App } from '@/api/ios'
import { SearchOutlined } from '@ant-design/icons'

import { useRequest } from 'ahooks'
import { Avatar, Button, Input, Popconfirm, Space, Table, Tabs } from 'antd'
import React, { useRef, useState } from 'react'
import Highlighter from 'react-highlight-words'

import { killApp, launchApp, listApp, uninstallApp } from '@/api/ios'

interface AppTabPaneProps {
  udid: string
}

const AppTabPane: React.FC<AppTabPaneProps> = ({ udid }) => {
  const [activeKey, setActiveKey] = React.useState<string>('user')
  const { data: apps, loading } = useRequest(() => listApp(udid, activeKey), { refreshDeps: [activeKey] })
  const [searchText, setSearchText] = useState('')
  const [searchedColumn, setSearchedColumn] = useState('')
  const searchInput = useRef<InputRef>(null)

  type DataIndex = keyof App
  const handleSearch = (
    selectedKeys: string[],
    confirm: FilterDropdownProps['confirm'],
    dataIndex: DataIndex,
  ) => {
    confirm()
    setSearchText(selectedKeys[0])
    setSearchedColumn(dataIndex)
  }

  const handleReset = (clearFilters: () => void) => {
    clearFilters()
    setSearchText('')
  }

  const getColumnSearchProps = (dataIndex: DataIndex): TableColumnType<App> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
      <div className="p-2" onKeyDown={e => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
          className="mb-2 block"
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              confirm({ closeDropdown: false })
              setSearchText((selectedKeys as string[])[0])
              setSearchedColumn(dataIndex)
            }}
          >
            Filter
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              close()
            }}
          >
            close
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        .toString()
        .toLowerCase()
        .includes((value as string).toLowerCase()),
    filterDropdownProps: {
      onOpenChange(open) {
        if (open) {
          setTimeout(() => searchInput.current?.select(), 100)
        }
      },
    },
    render: text =>
      searchedColumn === dataIndex
        ? (
            <Highlighter
              highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
              searchWords={[searchText]}
              autoEscape
              textToHighlight={text ? text.toString() : ''}
            />
          )
        : (
            text
          ),
  })
  const items: TabsProps['items'] = [
    {
      key: 'user',
      label: '用户',
    },
    {
      key: 'system',
      label: '系统',
    },
    {
      key: 'filesharingapps',
      label: '文件分享',
    },
    {
      key: 'all',
      label: '全部',
    },
  ]
  const columns: TableColumnsType<App> = [
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
      ...getColumnSearchProps('CFBundleIdentifier'),
    },
    {
      title: 'CFBundleName',
      dataIndex: 'CFBundleName',
      key: 'CFBundleName',
      ...getColumnSearchProps('CFBundleName'),
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
          <Button onClick={() => onKill(record)}>关闭</Button>

          <Popconfirm
            title
            onConfirm={() => onUninstall(record)}
          >
            <Button danger>卸载</Button>
          </Popconfirm>
        </Space.Compact>
      ),
    },
  ]

  async function onLaunch(record: App) {
    await launchApp(udid, record.CFBundleIdentifier)
  }

  async function onKill(record: App) {
    await killApp(udid, record.CFBundleIdentifier)
  }

  async function onUninstall(record: App) {
    await uninstallApp(udid, record.CFBundleIdentifier)
  }

  return (
    <Space className="w-full" direction="vertical">
      <Tabs items={items} activeKey={activeKey} onChange={key => setActiveKey(key)}></Tabs>
      <Table loading={loading} dataSource={apps} columns={columns} pagination={{ showSizeChanger: true }} />
    </Space>

  )
}
export {
  AppTabPane,
}
