import { useLocalStorageState } from 'ahooks'

export function useIos() {
  const [splitterSizes, setSplitterSizes] = useLocalStorageState<(number | string)[]>(
    'use-local-storage-state-splitter-size',
  {
    defaultValue: (['30%', '70%']),
  },
  )

  const [splitterLayout, setSplitterLayout] = useLocalStorageState<'horizontal' | 'vertical'>(
    'use-local-storage-state-splitter-layout',
    {
      defaultValue: 'horizontal',
    },
  )

  const switchSplitterLayout = () => {
    if (splitterLayout === 'vertical') {
      setSplitterLayout('horizontal')
    }
    else {
      setSplitterLayout('vertical')
    }
  }

  const [tabKey, setTabKey] = useLocalStorageState<string>(
    'use-local-storage-state-tab-key',
    {
      defaultValue: 'apps',
    },
  )
  return {
    splitterSizes,
    setSplitterSizes,
    splitterLayout,
    switchSplitterLayout,
    tabKey,
    setTabKey,
  }
}
