import { Button, Card, Col, Empty, Image, message, Row, Space, Spin } from 'antd'
import React, { useEffect, useState } from 'react'

interface ScreenshotTabPaneProps {
  udid: string
}

const ScreenshotTabPane: React.FC<ScreenshotTabPaneProps> = ({ udid }) => {
  const [screenUrls, setScreenUrls] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  // 组件卸载时清理所有对象URL
  useEffect(() => {
    return () => {
      screenUrls.forEach(url => URL.revokeObjectURL(url))
    }
  }, [])

  async function quickCap() {
    setLoading(true)
    try {
      const url = `api/ios/${udid}/screenshot`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`截图失败: ${response.status} ${response.statusText}`)
      }

      const blob = await response.blob()
      const imageUrl = URL.createObjectURL(blob)
      setScreenUrls(prev => [...prev, imageUrl])
    }
    catch (error) {
      console.error('截图请求失败:', error)
      message.error('截图失败，请检查设备连接')
    }
    finally {
      setLoading(false)
    }
  }

  function removeScreen() {
    // 释放所有对象URL
    screenUrls.forEach(url => URL.revokeObjectURL(url))
    setScreenUrls([])
    message.info('已清空所有截图')
  }

  function downloadImg(url: string, index: number) {
    const time = new Date().toISOString().slice(0, 19).replace(/[:T-]/g, '')
    const fileName = `screenshot_${udid}_${time}_${index + 1}.png`

    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Space className="w-full" direction="vertical" size="middle">
      <Space className="float-right">
        <Button
          type="primary"
          onClick={quickCap}
          loading={loading}
          disabled={loading}
        >
          截图
        </Button>
        <Button
          danger
          onClick={removeScreen}
          disabled={screenUrls.length === 0 || loading}
        >
          清空
        </Button>
      </Space>

      {loading && <Spin tip="截图中..." className="w-full flex justify-center" />}

      {!loading && screenUrls.length === 0
        ? (
            <Empty description="暂无截图" />
          )
        : (
            <Row gutter={[16, 16]}>
              {screenUrls.map((screenUrl, index) => (
                <Col key={index} xs={24} sm={12} md={8} lg={6}>
                  <Card
                    hoverable
                    cover={(
                      <Image
                        src={screenUrl}
                        alt={`设备截图 ${index + 1}`}
                        className="max-h-80 object-contain py-4"
                      />
                    )}
                    actions={[
                      <Button
                        type="link"
                        onClick={() => downloadImg(screenUrl, index)}
                        key="download"
                      >
                        下载
                      </Button>,
                    ]}
                  >
                    <Card.Meta
                      title={`截图 ${index + 1}`}
                      description={`${new Date().toLocaleString()}`}
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          )}
    </Space>
  )
}

export {
  ScreenshotTabPane,
}
