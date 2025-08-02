import type { RouteObject } from 'react-router'
import { lazy } from 'react'

const Layout = lazy(() => import('@/layout').then(m => ({ default: m.MyLayout })))
const Home = lazy(() => import('@/pages/home').then(m => ({ default: m.Home })))
const Ios = lazy(() => import('@/pages/ios/:id').then(m => ({ default: m.Ios })))

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: '/ios',
        children: [
          {
            path: ':udid',
            element: <Ios />,
          },
        ],
      },
    ],

  },
]

export { routes }
