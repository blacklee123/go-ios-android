export interface PerfDataBase {
  type: string
  timestamp: number // int64 在 JS/TS 中用 number 表示
  msg?: string // omitempty 对应为可选属性
}

export interface SystemMemData extends PerfDataBase {
  app_memory: number
  free_memory: number
  used_memory: number
  wired_memory: number
  cached_files: number
  compressed: number
  swap_used: number
}
