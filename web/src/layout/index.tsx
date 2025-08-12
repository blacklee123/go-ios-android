import { Layout } from 'antd'
import React from 'react'
import { Outlet } from 'react-router'

const MyLayout: React.FC = () => {
  return (
    <Layout className="min-h-screen">
      <Outlet />
    </Layout>
  )
}

export { MyLayout }
