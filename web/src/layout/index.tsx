import { Layout } from 'antd'
import React from 'react'
import { Outlet } from 'react-router'

const MyLayout: React.FC = () => {
  return (
    <Layout className="h-screen">
      <Outlet />
    </Layout>
  )
}

export { MyLayout }
