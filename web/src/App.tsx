import { RouterProvider, createHashRouter } from 'react-router'
import { App, ConfigProvider } from 'antd'
import NiceModal from '@ebay/nice-modal-react'
import { routes } from './routes'
import zhCN from 'antd/es/locale/zh_CN'

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
