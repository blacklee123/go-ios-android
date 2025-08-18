import type { SystemMemData } from '@/api/ios/perfTypes'
import dayjs from 'dayjs'
import * as echarts from 'echarts'
import React, { useEffect, useRef } from 'react'
import { echartsLineEmptyOptions } from '@/constants'

interface SysMemChartProps {
  data: SystemMemData[]
}

const SysMemChart: React.FC<SysMemChartProps> = ({ data }) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | undefined>(undefined)

  useEffect(() => {
    if (!chartRef.current)
      return

    const initializeChart = () => {
      if (!chartRef.current)
        return

      chartInstance.current = echarts.getInstanceByDom(chartRef.current)

      if (!chartInstance.current) {
        chartInstance.current = echarts.init(chartRef.current)
      }

      chartInstance.current.resize()
    }

    initializeChart()

    const handleResize = () => {
      chartInstance.current?.resize()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chartInstance.current?.dispose()
    }
  }, [])

  useEffect(() => {
    if (!chartInstance.current)
      return
    chartInstance.current.clear()
    if (data.length === 0) {
      chartInstance.current.setOption(echartsLineEmptyOptions)
      return
    }

    const option: echarts.EChartsOption = {
      color: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#409EFF'],
      title: {
        text: 'System Memory',
        textStyle: { color: '#606266' },
        // x: 'center',
        // y: 'top',
      },
      tooltip: { trigger: 'axis' },
      grid: { top: '30%', left: '13%' },
      toolbox: {
        feature: { saveAsImage: { show: true, title: 'Save' } },
      },
      legend: {
        top: '8%',
        data: [
          'App Memory',
          'Free Memory',
          'Cached Files',
          'Compressed',
          'Used Memory',
          'Wired Memory',
        ],
      },
      xAxis: {
        boundaryGap: false,
        type: 'category',
        data: data.map(obj => dayjs(obj.timestamp * 1000).format('HH:mm:ss')),
      },
      dataZoom: [{
        show: true,
        realtime: true,
        start: 30,
        end: 100,
      }],
      yAxis: [{
        name: `内存占用(b)`,
        min: 0,
      }],
      series: [
        { name: 'App Memory', type: 'line', data: data.map(obj => obj.app_memory), showSymbol: false },
        { name: 'Free Memory', type: 'line', data: data.map(obj => obj.free_memory), showSymbol: false },
        { name: 'Cached Files', type: 'line', data: data.map(obj => obj.cached_files), showSymbol: false },
        { name: 'Compressed', type: 'line', data: data.map(obj => obj.compressed), showSymbol: false },
        { name: 'Used Memory', type: 'line', data: data.map(obj => obj.used_memory), showSymbol: false },
        { name: 'Wired Memory', type: 'line', data: data.map(obj => obj.wired_memory), showSymbol: false },
      ],
    }
    chartInstance.current.setOption(option, true)
  }, [data])

  return (
    <div
      ref={chartRef}
      style={{ width: '100%', height: '350px' }}
    >
    </div>
  )
}

export { SysMemChart }
