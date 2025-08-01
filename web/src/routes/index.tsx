import type { RouteObject } from 'react-router'
import { lazy } from 'react'

// const Layout = lazy(() => import('@/layout').then(m => ({ default: m.App })))
const Home = lazy(() => import('@/pages/home').then(m => ({ default: m.Home })))

const routes: RouteObject[] = [
  {
    path: '/',
    children: [
      {
        index: true,
        element: <Home />,
      },
    ],

  },
]

export { routes }
