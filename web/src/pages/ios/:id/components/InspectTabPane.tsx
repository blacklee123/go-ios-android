import type { WebDriverAgentClient } from '@go-ios-android/wda'
import type { WindowSizeResponse } from '@go-ios-android/wda/types'
import type { SelectProps, TreeProps } from 'antd'
import type { ElementDetail, ElementNode } from '@/utils'
import { useRequest } from 'ahooks'
import { Col, Form, Input, Row, Select, Space, Spin, Tree } from 'antd'
import React, { useRef, useState } from 'react'
import { parseWDAXml } from '@/utils'

interface TreeNode {
  key: string // 必须
  title: string // 必须
  label: string
  detail: ElementDetail
  children?: TreeNode[]
}

function convertToTreeData(nodes: ElementNode[]): TreeNode[] {
  return nodes.map(node => ({
    key: node.id.toString(), // 必须转为字符串
    title: node.label, // 必须
    label: node.label,
    detail: node.detail,
    children: node.children ? convertToTreeData(node.children) : undefined,
  }))
}

interface InspectTabPaneProps {
  udid: string
  windowSize: WindowSizeResponse | undefined
  driver: WebDriverAgentClient
}

const InspectTabPane: React.FC<InspectTabPaneProps> = ({ udid, driver, windowSize }) => {
  const imgRef = useRef<HTMLImageElement>(null)
  // const setImgData = () => {
  //   const img = new Image()
  //   img.src = `/api/ios/${udid}/screenshot`
  //   const canvas = document.getElementById('debugPicIOS')
  //   img.onload = function () {
  //     canvas.width = img.width
  //     canvas.height = img.height
  //   }
  // }

  const [form] = Form.useForm()
  const [selected, setSelected] = useState<string | undefined>(undefined)
  const [selectedNode, setSelectedNode] = useState<TreeNode | undefined>(undefined)
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const { data: rawData = [], runAsync: runWda, loading } = useRequest(
    async () => {
      const res = await driver.source()
      const parsedData = parseWDAXml(res.value)
      const treeData = convertToTreeData(parsedData || [])
      // setImgData()
      return treeData
    },
    {
      manual: true,
    },
  )

  const onChange: SelectProps['onChange'] = async (value) => {
    setSelected(value)
    await runWda()
  }

  const onSelect: TreeProps['onSelect'] = async (selectedKeys, info) => {
    console.log('selected', info.node)
    setSelectedNode(info.node)
    setSelectedKeys(selectedKeys)
    form.setFieldsValue(info.node.detail)
  }

  const calculateDeviceCoordinates = (event: React.MouseEvent) => {
    if (!imgRef.current)
      return { x: 0, y: 0 }

    const img = imgRef.current
    const rect = img.getBoundingClientRect()
    const scaleX = windowSize!.value.width / rect.width
    const scaleY = windowSize!.value.height / rect.height

    const x = (event.clientX - rect.left) * scaleX
    const y = (event.clientY - rect.top) * scaleY

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
    // setExpandedKeys([result.ele.id])
    return result.ele
  }

  const print = (data: TreeNode) => {
    const canvas = document.getElementById('debugPicIOS')
    const g = canvas.getContext('2d')
    g.clearRect(0, 0, canvas.width, canvas.height)
    const eleStartX = Number.parseInt(data.detail.x)
    const eleStartY = Number.parseInt(data.detail.y)
    const eleEndX = Number.parseInt(data.detail.x) + Number.parseInt(data.detail.width)
    const eleEndY = Number.parseInt(data.detail.y) + Number.parseInt(data.detail.height)
    const a = Math.round(Math.random() * 255)
    const b = Math.round(Math.random() * 255)
    const c = Math.round(Math.random() * 255)
    g.fillStyle = `rgba(${a}, ${b}, ${c}, 0.6)`
    g.fillRect(
      eleStartX * (canvas.width / windowSize!.value.width),
      eleStartY * (canvas.height / windowSize!.value.height),
      (eleEndX - eleStartX) * (canvas.width / windowSize!.value.width),
      (eleEndY - eleStartY) * (canvas.height / windowSize!.value.height),
    )
  }

  const touchstart = async (event: React.MouseEvent) => {
    const { x, y } = calculateDeviceCoordinates(event)
    console.log('xy', x, y)
    const elements = findElementByPoint(rawData, x, y)
    console.log('elements', elements)
    const res = findMinSize(elements)
    if (res) {
      setSelectedKeys([res.key])
      setSelectedNode(res)
      console.log(res)
      print(res)
    }
  }

  return (
    <Space className="w-full" direction="vertical">
      <Select
        className="w-48"
        value={selected}
        onChange={onChange}
        options={[
          { value: 'jack', label: 'Jack' },
          { value: 'lucy', label: 'Lucy' },
          { value: 'Yiminghe', label: 'yiminghe' },
          { value: 'disabled', label: 'Disabled', disabled: true },
        ]}
      />
      { selected
        && (
          <Row gutter={[24, 24]}>
            <Col span={7}>
              <img
                ref={imgRef}
                draggable={false}
                onMouseDown={touchstart}
                src={`/api/ios/${udid}/screenshot`}
              />
              {/* <canvas
                id="debugPicIOS"
              >
              </canvas> */}
            </Col>
            <Col span={9}>
              <Spin spinning={loading}>
                {
                  rawData.length && (
                    <Tree
                      treeData={rawData}
                      onSelect={onSelect}
                      height={648}
                      defaultExpandedKeys={[rawData[0].key]}
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
                  <Form form={form}>
                    <Form.Item label="type" name="type">
                      <Input />
                    </Form.Item>
                    <Form.Item label="accessible" name="accessible">
                      <Input />
                    </Form.Item>
                    <Form.Item label="enabled" name="enabled">
                      <Input />
                    </Form.Item>
                    <Form.Item label="height" name="height">
                      <Input />
                    </Form.Item>
                    <Form.Item label="width" name="width">
                      <Input />
                    </Form.Item>
                    <Form.Item label="index" name="index">
                      <Input />
                    </Form.Item>
                    <Form.Item label="traits" name="traits">
                      <Input />
                    </Form.Item>
                    <Form.Item label="visible" name="visible">
                      <Input />
                    </Form.Item>
                    <Form.Item label="x" name="x">
                      <Input />
                    </Form.Item>
                    <Form.Item label="y" name="y">
                      <Input />
                    </Form.Item>
                    <Form.Item label="xpath" name="xpath">
                      <Input />
                    </Form.Item>
                  </Form>
                )
              }

            </Col>
          </Row>
        )}

    </Space>
  )
}
export {
  InspectTabPane,
}
