// 类型定义
export interface WdaElementDetail {
  xpath: string
  [attr: string]: string // 动态属性
}

export interface WdaElementNode {
  id: number
  label: string
  detail: WdaElementDetail
  children?: WdaElementNode[]
}

let xpathId = 1

/**
 * 解析 WDA 返回的 XML 结构并转换为元素树
 * @param xmlString WDA 返回的 XML 字符串
 * @returns 元素节点树
 */
export function parseWDAXml(xmlString: string): WdaElementNode[] {
  try {
    // 重置全局 ID 计数器
    xpathId = 1

    // 使用浏览器内置解析器处理 XML
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml')

    // 获取根元素 (XCUIElementTypeApplication)
    const rootElement = xmlDoc.documentElement

    // 处理根元素及其子元素
    return getChildElements([rootElement], '')
  }
  catch (e) {
    console.error('XML 解析错误:', e)
    return []
  }
}

/**
 * 递归处理子元素
 * @param elements 当前层级的元素集合
 * @param parentXpath 父元素的 XPath
 * @returns 元素节点数组
 */
export function getChildElements(elements: Element[], parentXpath: string): WdaElementNode[] {
  const elementList: WdaElementNode[] = []

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i]
    const tagName = element.tagName

    // 计算同级相同类型元素的数量和当前索引
    let sameTypeCount = 0
    let currentIndex = 0

    for (let j = 0; j < elements.length; j++) {
      if (elements[j].tagName === tagName) {
        sameTypeCount++
        if (j === i)
          currentIndex = sameTypeCount
      }
    }

    // 构建当前元素的 XPath
    const currentXpath = sameTypeCount === 1
      ? `${parentXpath}/${tagName}`
      : `${parentXpath}/${tagName}[${currentIndex}]`

    // 创建元素节点
    const node: WdaElementNode = {
      id: xpathId++,
      label: `<${tagName}>`,
      detail: {
        xpath: currentXpath,
        ...collectElementAttributes(element),
      },
    }

    // 递归处理子元素（仅处理元素节点）
    const childElements = Array.from(element.children)
    if (childElements.length > 0) {
      node.children = getChildElements(childElements, currentXpath)
    }

    elementList.push(node)
  }

  return elementList
}

/**
 * 收集元素的所有属性
 * @param element XML 元素
 * @returns 属性键值对
 */
export function collectElementAttributes(element: Element): Record<string, string> {
  const attributes: Record<string, string> = {}

  // 遍历所有属性节点
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i]
    attributes[attr.name] = attr.value
  }

  return attributes
}
