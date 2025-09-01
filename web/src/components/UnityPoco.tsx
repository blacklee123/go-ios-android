import type { WebDriverAgentClient } from '@go-ios-android/wda'
import type { WindowSizeResponse } from '@go-ios-android/wda/types'
import type { TreeProps } from 'antd'
import type { PocoNode } from '@/api/ios/poco'
import type { ElementDetail } from '@/utils'

import { useRequest } from 'ahooks'
import { Col, Form, Input, Row, Spin, Switch, Tree } from 'antd'
import React, { useEffect, useRef, useState } from 'react'
import { pocoDump } from '@/api/ios/poco'

interface IosPocoProps {
  udid: string
  windowSize: WindowSizeResponse | undefined
  driver: WebDriverAgentClient
}

interface TreeNode {
  key: string // 必须
  title: string // 必须
  label: string
  detail: ElementDetail
  children?: TreeNode[]
}

function convertToTreeData(nodes: PocoNode[]): TreeNode[] {
  return nodes.map(node => ({
    key: node.name, // 必须转为字符串
    title: node.name, // 必须
    label: node.name,
    detail: node.payload,
    children: node.children ? convertToTreeData(node.children) : undefined,
  }))
}

const UnityPoco: React.FC<IosPocoProps> = ({ udid, windowSize }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgCacheRef = useRef<HTMLImageElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [form] = Form.useForm()
  const [selectedNode, setSelectedNode] = useState<TreeNode | undefined>(undefined)
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]) // 添加展开状态
  const [screenshotLoading, setScreenshotLoading] = useState(false)
  const [pixelRatio, setPixelRatio] = useState<number>(1)

  const { data: rawData = [], loading } = useRequest(
    async () => {
      const res = pocoDump(udid, 5001)
      // const parsedData = parseWDAXml(res.value)
      const treeData = convertToTreeData([res] || [])
      setExpandedKeys([treeData[0].key])
      return treeData
    },
  )

  // 高亮选中的元素
  const highlightElement = (node: TreeNode) => {
    if (!canvasRef.current || !windowSize || !imgCacheRef.current || !pixelRatio)
      return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx || !node.detail)
      return

    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 重新绘制截图
    ctx.drawImage(imgCacheRef.current, 0, 0, canvas.width, canvas.height)

    // 获取元素坐标（逻辑像素）
    const x = Number.parseInt(node.detail.x)
    const y = Number.parseInt(node.detail.y)
    const width = Number.parseInt(node.detail.width)
    const height = Number.parseInt(node.detail.height)

    // 转换为物理像素坐标
    const physicalX = x * pixelRatio
    const physicalY = y * pixelRatio
    const physicalWidth = width * pixelRatio
    const physicalHeight = height * pixelRatio

    // 绘制高亮框
    ctx.strokeStyle = '#1890ff'
    ctx.lineWidth = 2
    ctx.strokeRect(physicalX, physicalY, physicalWidth, physicalHeight)

    // 绘制半透明填充
    ctx.fillStyle = 'rgba(24, 144, 255, 0.3)'
    ctx.fillRect(physicalX, physicalY, physicalWidth, physicalHeight)
  }

  // 加载截图到Canvas
  const loadScreenshot = async () => {
    if (!canvasRef.current || !windowSize)
      return

    setScreenshotLoading(true)
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx)
      return

    // 创建临时图片加载截图
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.src = `/api/ios/${udid}/screenshot?t=${Date.now()}` // 添加时间戳避免缓存

    img.onload = () => {
      // 计算设备像素比
      const calculatedRatio = img.width / windowSize.value.width
      setPixelRatio(calculatedRatio)

      // 缓存图片用于重绘
      imgCacheRef.current = img

      // 设置Canvas内部绘制尺寸匹配图片
      canvas.width = img.width
      canvas.height = img.height

      // 绘制截图
      ctx.drawImage(img, 0, 0, img.width, img.height)
      setScreenshotLoading(false)

      // 如果有选中的节点，绘制高亮
      if (selectedNode) {
        highlightElement(selectedNode)
      }
    }

    img.onerror = () => {
      setScreenshotLoading(false)
      console.error('Failed to load screenshot')
    }
  }

  // 当选中节点变化时更新高亮
  useEffect(() => {
    if (selectedNode && imgCacheRef.current && pixelRatio) {
      highlightElement(selectedNode)
    }
  }, [selectedNode, pixelRatio])

  // 当选择应用时加载截图
  useEffect(() => {
    loadScreenshot()
  }, [])

  const onSelect: TreeProps['onSelect'] = async (selectedKeys, info) => {
    setSelectedNode(info.node as TreeNode)
    setSelectedKeys(selectedKeys as string[])
    form.setFieldsValue((info.node as TreeNode).detail)
  }

  // 处理树形控件的展开/折叠事件
  const onExpand: TreeProps['onExpand'] = (expandedKeys) => {
    setExpandedKeys(expandedKeys as string[])
  }

  const calculateDeviceCoordinates = (event: React.MouseEvent) => {
    if (!canvasRef.current || !windowSize || !pixelRatio || !containerRef.current)
      return { x: 0, y: 0 }

    const container = containerRef.current
    const rect = container.getBoundingClientRect()

    // 计算鼠标在容器上的相对位置（0-1范围）
    const relativeX = (event.clientX - rect.left) / rect.width
    const relativeY = (event.clientY - rect.top) / rect.height

    // 转换为设备逻辑坐标
    const x = relativeX * windowSize.value.width
    const y = relativeY * windowSize.value.height

    return { x, y }
  }

  const findElementByPoint = (ele: TreeNode[], x: number, y: number): { ele: TreeNode, size: number }[] => {
    const result: { ele: TreeNode, size: number }[] = []
    for (const i in ele) {
      const eleStartX = Number.parseInt(ele[i].detail.x)
      const eleStartY = Number.parseInt(ele[i].detail.y)
      const eleEndX = Number.parseInt(ele[i].detail.x) + Number.parseInt(ele[i].detail.width)
      const eleEndY = Number.parseInt(ele[i].detail.y) + Number.parseInt(ele[i].detail.height)
      if (x >= eleStartX && x <= eleEndX && y >= eleStartY && y <= eleEndY) {
        result.push({
          ele: ele[i],
          size: Number.parseInt(ele[i].detail.height) * Number.parseInt(ele[i].detail.width),
        })
      }
      if (ele[i].children) {
        const childrenResult = findElementByPoint(ele[i].children, x, y)
        result.push(...childrenResult)
      }
    }
    return result
  }

  const findMinSize = (data: { ele: TreeNode, size: number }[]): TreeNode | null => {
    if (data.length === 0) {
      return null
    }
    let result = data[0]
    for (const i in data) {
      if (data[i].size === result.size) {
        if (data[i].ele.detail.name && data[i].ele.detail.name.length !== 0) {
          result = data[i]
        }
      }
      if (data[i].size < result.size) {
        result = data[i]
      }
    }
    return result.ele
  }

  // 查找节点的所有父节点key（用于展开树）
  const findParentKeys = (node: TreeNode, treeData: TreeNode[]): string[] => {
    const keys: string[] = []

    function findPath(currentNode: TreeNode, path: string[], data: TreeNode[]): boolean {
      for (const item of data) {
        const newPath = [...path, item.key]
        if (item.key === currentNode.key) {
          keys.push(...newPath)
          return true
        }
        if (item.children && item.children.length > 0) {
          const found = findPath(currentNode, newPath, item.children)
          if (found)
            return true
        }
      }
      return false
    }

    findPath(node, [], treeData)
    return keys
  }

  const handleCanvasClick = async (event: React.MouseEvent) => {
    if (!windowSize || !canvasRef.current || !rawData.length)
      return

    const { x, y } = calculateDeviceCoordinates(event)
    const elements = findElementByPoint(rawData, x, y)
    const target = findMinSize(elements)

    if (target) {
      setSelectedKeys([target.key])
      setSelectedNode(target)
      form.setFieldsValue(target.detail)

      // 查找并展开所有父节点
      const parentKeys = findParentKeys(target, rawData)
      setExpandedKeys(prev => [...new Set([...prev, ...parentKeys])])
    }
  }

  // 计算宽高比
  const aspectRatio = windowSize
    ? windowSize.value.height / windowSize.value.width
    : 0

  return (
    <Row gutter={[24, 24]}>
      <Col span={7}>
        <Spin spinning={screenshotLoading}>
          <div
            ref={containerRef}
            style={{
              position: 'relative',
              width: '100%',
              paddingBottom: `${aspectRatio * 100}%`,
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              overflow: 'hidden',
              backgroundColor: '#f0f0f0',
            }}
          >
            <canvas
              ref={canvasRef}
              onMouseDown={handleCanvasClick}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                cursor: 'pointer',
                objectFit: 'contain',
              }}
            />
          </div>
        </Spin>
      </Col>
      <Col span={9}>
        <Spin spinning={loading}>
          {
            rawData.length > 0 && (
              <Tree
                treeData={rawData}
                onSelect={onSelect}
                onExpand={onExpand} // 添加展开事件处理
                expandedKeys={expandedKeys} // 控制展开状态
                height={648}
                selectedKeys={selectedKeys}
              >
              </Tree>
            )
          }
        </Spin>
      </Col>
      <Col span={8}>
        {
          selectedNode && (
            <Form form={form} size="small" labelCol={{ span: 6 }}>
              <Form.Item label="type" name="type">
                <Input />
              </Form.Item>
              <Form.Item label="name" name="name">
                <Input />
              </Form.Item>
              <Form.Item label="label" name="label">
                <Input />
              </Form.Item>
              <Form.Item label="index" name="index">
                <Input />
              </Form.Item>
              <Form.Item label="enabled" name="enabled">
                <Switch />
              </Form.Item>
              <Form.Item label="visible" name="visible">
                <Switch />
              </Form.Item>
              <Form.Item label="accessible" name="accessible">
                <Switch />
              </Form.Item>
              <Form.Item label="x" name="x">
                <Input />
              </Form.Item>
              <Form.Item label="y" name="y">
                <Input />
              </Form.Item>
              <Form.Item label="width" name="width">
                <Input />
              </Form.Item>
              <Form.Item label="height" name="height">
                <Input />
              </Form.Item>
              <Form.Item label="xpath" name="xpath">
                <Input.TextArea autoSize />
              </Form.Item>
              <Form.Item label="traits" name="traits">
                <Input />
              </Form.Item>
            </Form>
          )
        }
      </Col>
    </Row>
  )
}

export { UnityPoco }
