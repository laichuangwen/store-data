import { describe, expect, it, vi } from 'vitest'
import Table from '../src/Table'
import { AutofillPlugin } from '../src/plugins/Autofill'

describe('AutofillPlugin', () => {
  it('down / right 应支持链式配置', () => {
    const plugin = new AutofillPlugin()
    expect(plugin.down()).toBe(plugin)
    expect(plugin.right()).toBe(plugin)
  })

  it('install 时应被 Table.use 调用', () => {
    const table = new Table()
    const plugin = new AutofillPlugin()
    const installSpy = vi.spyOn(plugin, 'install')

    table.use(plugin.down())

    expect(installSpy).toHaveBeenCalledTimes(1)
    expect(installSpy).toHaveBeenCalledWith(table)
  })
})
