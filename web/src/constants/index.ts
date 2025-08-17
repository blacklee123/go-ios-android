import type * as echarts from 'echarts'

export const echartsLineEmptyOptions: echarts.EChartsOption = {
  title: {
    text: 'System Memory',
    textStyle: { color: '#606266' },
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
  xAxis: { type: 'category', data: [] },
  yAxis: [{ name: `内存占用(b)`, min: 0 }],
  series: [
    { name: 'App Memory', type: 'line', data: [] },
    { name: 'Free Memory', type: 'line', data: [] },
    { name: 'Cached Files', type: 'line', data: [] },
    { name: 'Compressed', type: 'line', data: [] },
    { name: 'Used Memory', type: 'line', data: [] },
    { name: 'Wired Memory', type: 'line', data: [] },
  ],
  graphic: {
    type: 'text',
    left: 'center',
    top: 'middle',
    style: {
      text: '暂无数据',
      fill: '#999',
      fontSize: 16,
    },
  },
}
