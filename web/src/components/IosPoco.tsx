import type { WebDriverAgentClient } from '@go-ios-android/wda'
import type { WindowSizeResponse } from '@go-ios-android/wda/types'
import type { TreeDataNode, TreeProps } from 'antd'
import type { WdaElementDetail, WdaElementNode } from '@/utils'

import { useRequest } from 'ahooks'
import { Button, Col, Form, Input, Row, Skeleton, Space, Spin, Switch, Tree, Typography } from 'antd'
import React, { useEffect, useRef, useState } from 'react'
import { parseWDAXml } from '@/utils'

interface IosPocoProps {
  udid: string
  windowSize: WindowSizeResponse
  driver: WebDriverAgentClient
}

interface ExtendedTreeDataNode extends TreeDataNode {
  detail: WdaElementDetail
  children?: ExtendedTreeDataNode[]
}

function convertToTreeData(nodes: WdaElementNode[]): ExtendedTreeDataNode[] {
  return nodes.map(node => ({
    key: node.id.toString(),
    title: node.label,
    detail: node.detail,
    children: node.children ? convertToTreeData(node.children) : undefined,
  }))
}

// 高亮元素的纯函数
function highlightElement(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement | null,
  pixelRatio: number,
  node: ExtendedTreeDataNode,
): void {
  if (!img || !node.detail)
    return

  const ctx = canvas.getContext('2d')
  if (!ctx)
    return

  // 清除画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 重新绘制截图
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

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

// 计算设备坐标的纯函数
function calculateDeviceCoordinates(
  containerRect: DOMRect,
  windowSize: WindowSizeResponse,
  event: React.MouseEvent,
): { x: number, y: number } {
  // 计算鼠标在容器上的相对位置（0-1范围）
  const relativeX = (event.clientX - containerRect.left) / containerRect.width
  const relativeY = (event.clientY - containerRect.top) / containerRect.height

  // 转换为设备逻辑坐标
  const x = relativeX * windowSize.value.width
  const y = relativeY * windowSize.value.height

  return { x, y }
}

// 查找元素的最小尺寸
function findMinSize(data: { ele: ExtendedTreeDataNode, size: number }[]): ExtendedTreeDataNode | null {
  if (data.length === 0) {
    return null
  }

  let result = data[0]
  for (const item of data) {
    if (item.size === result.size) {
      if (item.ele.detail?.name && item.ele.detail.name.length !== 0) {
        result = item
      }
    }
    if (item.size < result.size) {
      result = item
    }
  }
  return result.ele
}

const IosPoco: React.FC<IosPocoProps> = ({ udid, driver, windowSize }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgCacheRef = useRef<HTMLImageElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [form] = Form.useForm()
  const [selectedNode, setSelectedNode] = useState<ExtendedTreeDataNode>()
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([])
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([])
  const [screenshotLoading, setScreenshotLoading] = useState(false)
  const [pixelRatio, setPixelRatio] = useState<number>(1)

  const { data: treeData, loading, refresh: refreshWdaSource } = useRequest(
    async () => {
      const res = await driver.source()
      const parsedData = parseWDAXml(res.value)
      const treeData = convertToTreeData(parsedData)
      setExpandedKeys([treeData[0].key])
      return treeData
    },
  )

  // 查找元素的纯函数
  const findElementByPoint = (
    elements: ExtendedTreeDataNode[],
    x: number,
    y: number,
  ): { ele: ExtendedTreeDataNode, size: number }[] => {
    const result: { ele: ExtendedTreeDataNode, size: number }[] = []

    for (const element of elements) {
      if (!element.detail)
        continue

      const eleStartX = Number.parseInt(element.detail.x)
      const eleStartY = Number.parseInt(element.detail.y)
      const eleEndX = eleStartX + Number.parseInt(element.detail.width)
      const eleEndY = eleStartY + Number.parseInt(element.detail.height)

      if (x >= eleStartX && x <= eleEndX && y >= eleStartY && y <= eleEndY) {
        result.push({
          ele: element,
          size: Number.parseInt(element.detail.height) * Number.parseInt(element.detail.width),
        })
      }

      if (element.children) {
        const childrenResult = findElementByPoint(element.children, x, y)
        result.push(...childrenResult)
      }
    }

    return result
  }

  // 查找节点的所有父节点key（用于展开树）
  const findParentKeys = (
    node: ExtendedTreeDataNode,
    treeData: ExtendedTreeDataNode[],
  ): React.Key[] => {
    const keys: React.Key[] = []

    function findPath(currentNode: ExtendedTreeDataNode, path: React.Key[], data: ExtendedTreeDataNode[]): boolean {
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

  // 当选中节点变化时更新高亮
  useEffect(() => {
    if (selectedNode && imgCacheRef.current && pixelRatio && canvasRef.current) {
      highlightElement(canvasRef.current, imgCacheRef.current, pixelRatio, selectedNode)
    }
  }, [selectedNode, pixelRatio])

  // 加载截图到Canvas
  const loadScreenshot = async () => {
    if (!canvasRef.current)
      return

    setScreenshotLoading(true)
    const canvas = canvasRef.current

    // 创建临时图片加载截图
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.src = `/api/ios/${udid}/screenshot?t=${Date.now()}` // 添加时间戳避免缓存

    img.onload = () => {
      // 计算设备像素比
      setPixelRatio(img.width / windowSize.value.width)

      // 缓存图片用于重绘
      imgCacheRef.current = img

      // 设置Canvas内部绘制尺寸匹配图片
      canvas.width = img.width
      canvas.height = img.height

      const ctx = canvas.getContext('2d')
      if (ctx) {
        // 绘制截图
        ctx.drawImage(img, 0, 0, img.width, img.height)

        // 如果有选中的节点，绘制高亮
        if (selectedNode) {
          highlightElement(canvas, img, pixelRatio, selectedNode)
        }
      }

      setScreenshotLoading(false)
    }

    img.onerror = () => {
      setScreenshotLoading(false)
      console.error('Failed to load screenshot')
    }
  }

  const handleCanvasClick = async (event: React.MouseEvent) => {
    if (!canvasRef.current || !treeData || !containerRef.current)
      return

    const containerRect = containerRef.current.getBoundingClientRect()
    const { x, y } = calculateDeviceCoordinates(containerRect, windowSize, event)

    const elements = findElementByPoint(treeData, x, y)
    const target = findMinSize(elements)

    if (target) {
      setSelectedKeys([target.key])
      setSelectedNode(target)
      form.setFieldsValue(target.detail)

      // 查找并展开所有父节点
      const parentKeys = findParentKeys(target, treeData)
      setExpandedKeys(prev => [...new Set([...prev, ...parentKeys])])
    }
  }

  // 当选择应用时加载截图
  useEffect(() => {
    loadScreenshot()
  }, [])

  // 计算宽高比
  const aspectRatio = windowSize.value.height / windowSize.value.width

  const treeTitleRender: TreeProps['titleRender'] = (nodeData) => {
    const node = nodeData as ExtendedTreeDataNode
    return (
      <>
        <span>
          {node.title}
        </span>
        {
          node.detail?.name && node.detail.name !== ' ' && (
            <Typography.Text type="secondary">
              {' '}
              name =
              {' '}
              {node.detail.name}
            </Typography.Text>
          )
        }
      </>
    )
  }

  function handleRefresh() {
    refreshWdaSource()
    loadScreenshot()
    setSelectedNode(undefined)
    setSelectedKeys([])
    setExpandedKeys([])
  }

  const onTreeNodeSelect: TreeProps['onSelect'] = (selectedKeys, info) => {
    setSelectedNode(info.node as TreeDataNode as ExtendedTreeDataNode)
    setSelectedKeys(selectedKeys)
    form.setFieldsValue((info.node as TreeDataNode as ExtendedTreeDataNode).detail)
  }

  // 处理树形控件的展开/折叠事件
  const onTreeExpand: TreeProps['onExpand'] = (expandedKeys) => {
    setExpandedKeys(expandedKeys)
  }

  return (
    <Row gutter={[24, 24]}>
      <Col span={24}><Button onClick={handleRefresh} type="primary" loading={loading}>重新获取控件元素</Button></Col>
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
        <Skeleton loading={loading} active>
          {
            treeData && (
              <Space direction="vertical" className="w-full">
                <Input.Search />
                <Tree
                  treeData={treeData}
                  titleRender={treeTitleRender}
                  onSelect={onTreeNodeSelect}
                  onExpand={onTreeExpand}
                  expandedKeys={expandedKeys}
                  // height={648}
                  selectedKeys={selectedKeys}
                />
              </Space>
            )
          }
        </Skeleton>
      </Col>
      <Col span={8}>
        {
          selectedNode && (
            <Form form={form} size="small" labelCol={{ span: 6 }} disabled>
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

export { IosPoco }
