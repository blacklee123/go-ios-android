import NiceModal from '@ebay/nice-modal-react'
import { App, ConfigProvider } from 'antd'
import zhCN from 'antd/es/locale/zh_CN'
import { createHashRouter, RouterProvider } from 'react-router'
import { routes } from './routes'

function MyApp() {
  return (
    <ConfigProvider
      locale={zhCN}
      componentSize="middle"
    >
      <App>
        <NiceModal.Provider>
          <RouterProvider router={createHashRouter(routes)} />
        </NiceModal.Provider>
      </App>
    </ConfigProvider>
  )
}

export default MyApp
