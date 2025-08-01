import type { Device } from '@/api'
import type { DescriptionsProps } from 'antd'
import { listIos } from '@/api'
import { useRequest } from 'ahooks'
import {
  Button,
  Card,
  Col,
  Descriptions,
  Flex,
  Popover,
  Row,
  Space,
  Spin,
  Image,
} from 'antd'
import React from 'react'

const Home: React.FC = () => {
  const { data: devices = [], loading } = useRequest(listIos)

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

  return (
    <Spin spinning={loading}>
      <Row>
        {
          devices.map(device => (
            <Col
              key={device.udId}
              lg={8}
              xxl={6}
            >
              <Card title={device.name} extra={<a href="#">空闲中</a>}>
                <Space direction="vertical">
                  <Row>
                    <Col span={12}>
                      <Image src={`/api/ios/${device.device_serialno}/screenshot`} alt="这里应该有一张图片" />
                    </Col>
                    <Col span={12}>
                      <Descriptions column={1} items={createDevicesDescriptions(device)} />
                    </Col>
                  </Row>
                  <Flex justify="center" gap={12}>
                    <Button type="primary" size="small">马上使用</Button>
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

export { Home }
