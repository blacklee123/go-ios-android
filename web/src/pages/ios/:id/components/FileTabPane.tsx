import type { Key } from 'react'
import { DownloadOutlined } from '@ant-design/icons'
import { useRequest } from 'ahooks'
import { Empty, Select, Space, Spin, Tooltip, Tree } from 'antd'
import React, { useCallback, useState } from 'react'
import { listApp, listFile } from '@/api/ios'

interface FileTreeNode {
  title: string
  key: string
  isLeaf: boolean
  children?: FileTreeNode[]
}

interface FileTabPaneProps {
  udid: string
}

const FileTabPane: React.FC<FileTabPaneProps> = ({ udid }) => {
  const [treeData, setTreeData] = useState<FileTreeNode[]>([])
  const [appBundleId, setAppBundleId] = useState<string>('')

  // 将文件列表转换为树节点
  const generateTreeNodes = useCallback((parentPath: string, files: string[]): FileTreeNode[] => {
    return files.map((file) => {
      const fullPath = `${parentPath}${file}`
      const isDirectory = file.endsWith('/')

      return {
        title: file.replace(/\/$/, ''),
        key: fullPath,
        isLeaf: !isDirectory,
        // 初始时不加载子目录，展开时动态加载
        children: isDirectory ? [] : undefined,
      }
    })
  }, [])

  const { data: apps = [], loading: appLoading } = useRequest(() => listApp(udid, 'filesharingapps'))

  // 加载根目录
  const { loading: rootLoading } = useRequest(() => listFile(udid, appBundleId), {
    onSuccess: (files) => {
      const rootNodes = generateTreeNodes('/', files)
      setTreeData(rootNodes)
    },
    onError: () => setTreeData([]),
    refreshDeps: [appBundleId],
  })

  // 动态加载子节点数据
  const loadTreeData = useCallback(async (key: Key) => {
    const path = key.toString()

    try {
      const files = await listFile(udid, appBundleId, path)
      const childNodes = generateTreeNodes(path, files)

      // 更新树数据
      setTreeData((prev) => {
        const updateNode = (nodes: FileTreeNode[]): FileTreeNode[] => {
          return nodes.map((node) => {
            if (node.key === path) {
              return { ...node, children: childNodes }
            }
            if (node.children) {
              return { ...node, children: updateNode(node.children) }
            }
            return node
          })
        }
        return updateNode(prev)
      })
    }
    catch (error) {
      console.error('加载目录失败:', error)
    }
  }, [udid, generateTreeNodes])

  // 处理目录展开
  const handleExpand = useCallback(async (keys: Key[], info: any) => {
    if (info.node.children && info.node.children.length > 0)
      return

    await loadTreeData(info.node.key)
  }, [loadTreeData])

  // 处理节点加载
  const handleLoadData = useCallback(({ key, children }: any) => {
    if (children) {
      return Promise.resolve()
    }
    return loadTreeData(key)
  }, [loadTreeData])

  function downloadFile(url: string) {
    const link = document.createElement('a')
    link.href = url
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function titleRender(nodeData: FileTreeNode) {
    return (
      <div className="inline-flex group gap-2">
        <span>{nodeData.title}</span>
        <Space className="flex-1 invisible group-hover:visible">
          <Tooltip title="下载">
            <DownloadOutlined
              className="text-blue-400"
              onClick={(e) => {
                e.stopPropagation()
                downloadFile(`/api/ios/${udid}/fsync/pull/${nodeData.key}`)
              }}
            />
          </Tooltip>
        </Space>
      </div>
    )
  }

  return (
    <Space direction="vertical" className="w-full">
      {/* <Select
        className="w-48"
        loading={appLoading}
        options={apps.map(app => ({ label: app.CFBundleName, value: app.CFBundleIdentifier }))}
        onSelect={value => setAppBundleId(value)}
      /> */}
      {
        rootLoading
          ? <Spin tip="加载文件列表中..." style={{ width: '100%', padding: '40px 0' }} />
          : !treeData || treeData.length === 0
              ? <Empty description="暂无文件数据" />
              : (
                  <Tree.DirectoryTree
                    height={480}
                    loadData={handleLoadData}
                    onExpand={handleExpand}
                    treeData={treeData}
                    titleRender={titleRender}
                  />
                )
      }
    </Space>
  )
}

export {
  FileTabPane,
}
