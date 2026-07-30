import { describe, expect, it, vi } from 'vitest'
import Table, { type TablePlugin } from '../src/Table'

describe('Table', () => {
  it('use 应安装插件并支持链式调用', () => {
    const table = new Table()
    const install = vi.fn()
    const plugin: TablePlugin = { install }

    const ret = table.use(plugin)

    expect(ret).toBe(table)
    expect(install).toHaveBeenCalledTimes(1)
    expect(install).toHaveBeenCalledWith(table)
  })

  it('应按注册顺序安装多个插件', () => {
    const table = new Table()
    const order: string[] = []
    const a: TablePlugin = {
      install: () => {
        order.push('a')
      },
    }
    const b: TablePlugin = {
      install: () => {
        order.push('b')
      },
    }

    table.use(a).use(b)

    expect(order).toEqual(['a', 'b'])
  })
})
