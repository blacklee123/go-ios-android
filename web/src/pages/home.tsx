import type { DescriptionsProps } from 'antd'
import type { Device } from '@/api'
import { useRequest } from 'ahooks'
import {
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Flex,
  Image,
  Popover,
  Row,
  Space,
  Spin,
} from 'antd'
import React from 'react'
import { Link } from 'react-router'
import { listDevice } from '@/api'

const Home: React.FC = () => {
  const { data: devices = [], loading } = useRequest(listDevice)

  return (
    <Spin spinning={loading}>
      <Row>
        {
          devices && devices.length === 0
            ? (
                <Col span={24}>
                  <Empty />
                </Col>
              )
            : devices.map(device => (
                <Col
                  key={device.udId}
                  lg={8}
                  xxl={6}
                >
                  <Card title={device.name} extra={<a href="#">空闲中</a>}>
                    <Space direction="vertical">
                      <Row>
                        <Col span={12} className="flex justify-center items-center">
                          <Image
                            height={200}
                            src={`/api/${device.platform === 'ios' ? 'ios' : 'android'}/${device.udId}/screenshot`}
                            alt="这里应该有一张图片"
                            className="max-h-full object-contain"
                          />
                        </Col>
                        <Col span={12}>
                          <Descriptions column={1} items={createDevicesDescriptions(device)} />
                        </Col>
                      </Row>
                      <Flex justify="center" gap={12}>
                        <Link to={`/${device.platform === 'ios' ? 'ios' : 'android'}/${device.udId}`}><Button type="primary" size="small">马上使用</Button></Link>
                        <Popover
                          content={<Descriptions className="w-48" column={1} items={createDevicesDescriptions(device)} />}
                          placement="top"
                        >
                          <Button size="small">更多信息</Button>
                        </Popover>
                      </Flex>
                    </Space>
                  </Card>
                </Col>
              ))
        }
      </Row>
    </Spin>
  )
}

function createDevicesDescriptions(record: Device) {
  const items: DescriptionsProps['items'] = [
    {
      key: '1',
      label: '设备型号',
      children: <p>{record.model}</p>,
    },
    {
      key: '1',
      label: '制造商',
      children: <p>{record.manufacturer}</p>,
    },
    {
      key: '1',
      label: '设备系统',
      children: <p>{`${record.platform} ${record.version}`}</p>,
    },
    {
      key: '1',
      label: '电池电量',
      children: <p>{`${record.level}%`}</p>,
    },
    {
      key: '1',
      label: '电池温度',
      children: <p>{record.temperature / 10}</p>,
    },
  ]
  return items
}

export { Home }
