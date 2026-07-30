import { beforeEach, describe, expect, it, vi } from 'vitest'
import Store from '../src/Store'

beforeEach(() => {
  vi.spyOn(console, 'time').mockImplementation(() => { })
  vi.spyOn(console, 'timeEnd').mockImplementation(() => { })
  vi.spyOn(console, 'log').mockImplementation(() => { })
  vi.spyOn(console, 'warn').mockImplementation(() => { })
  vi.spyOn(console, 'error').mockImplementation(() => { })
})

function createStore(overrides?: {
  columns?: any[]
  data?: any[]
}) {
  const columns = overrides?.columns ?? [
    { key: 'emp_no', title: '工号', width: 120 },
    {
      key: 'job_name',
      title: '岗位',
      children: [
        {
          key: 'emp_name1',
          title: '姓名1',
          children: [
            {
              key: 'emp_name11',
              title: '姓名11',
              width: 200,
              children: [
                { key: 'emp_name111', title: '姓名111', width: 200 },
                { key: 'emp_name112', title: '姓名112' },
                { key: 'emp_name113', title: '姓名113' },
              ],
            },
            {
              key: 'emp_name22',
              title: '姓名22',
              children: [
                { key: 'emp_name221', title: '姓名221', width: 200 },
                { key: 'emp_name222', title: '姓名222' },
                { key: 'emp_name223', title: '姓名223' },
              ],
            },
            {
              key: 'emp_name23',
              title: '姓名23',
            }
          ],
        },
        { key: 'emp_name2', title: '姓名2' },
      ],
    },
  ]
  const data = overrides?.data ?? [
    {
      id: '1',
      emp_no: '1',
      children: [
        { id: '1-1', emp_no: '1-1', children: [] },
        {
          id: '1-2',
          emp_no: '1-2',
          children: [
            { id: '1-2-1', emp_no: '1-2-1', children: [] },
            { id: '1-2-2', emp_no: '1-2-2', children: [] },
          ],
        },
      ],
    },
    { id: '2', emp_no: '2', children: [] },
  ]
  return new Store({ columns, data })
}

describe('Store', () => {
  describe('初始化', () => {
    it('应构建行列节点映射', () => {
      const store = createStore()
      expect(store.rowNodes).toHaveLength(2)
      expect(store.colNodes).toHaveLength(2)
      expect(store.rowNodeMaps.size).toBe(6)
      expect(store.getColNode('emp_name111')).toBeDefined()
      expect(store.getColNode('emp_name23')).toBeDefined()
      expect(store.getRowNode('1-2-1')).toBeDefined()
    })

    it('应计算 maxColLevel / sumWidth / sumHeight', () => {
      const store = createStore()
      expect(store.maxColLevel).toBe(3)
      // emp_no(120) + job_name(200+100+100 + 200+100+100 + 100 + 100) = 120 + 1000 = 1120
      expect(store.sumWidth).toBe(1120)
      // 仅顶层可见行：2 * 16
      expect(store.sumHeight).toBe(32)
    })
  })

  describe('列 colspan / rowspan', () => {
    it('叶子列 colspan 为 1，分组列为子树叶子数之和', () => {
      const store = createStore()
      expect(store.getColNode('emp_no')!.colspan).toBe(1)
      expect(store.getColNode('emp_name111')!.colspan).toBe(1)
      expect(store.getColNode('emp_name11')!.colspan).toBe(3)
      expect(store.getColNode('emp_name23')!.colspan).toBe(1)
      expect(store.getColNode('emp_name1')!.colspan).toBe(7)
      expect(store.getColNode('job_name')!.colspan).toBe(8)
    })

    it('叶子列 rowspan 应补齐到最大层级，有子列时为 1', () => {
      const store = createStore()
      expect(store.getColNode('emp_no')!.rowspan).toBe(4)
      expect(store.getColNode('emp_name2')!.rowspan).toBe(3)
      expect(store.getColNode('job_name')!.rowspan).toBe(1)
      expect(store.getColNode('emp_name111')!.rowspan).toBe(1)
      expect(store.getColNode('emp_name23')!.rowspan).toBe(2)
    })
  })

  describe('列 hide', () => {
    it('隐藏叶子列后 width/colspan 为 0，且不计入 sumWidth', () => {
      const store = createStore()
      const before = store.sumWidth
      store.setColHide('emp_name112', true)
      const col = store.getColNode('emp_name112')!
      expect(col.hide).toBe(true)
      expect(col.width).toBe(0)
      expect(col.colspan).toBe(0)
      expect(store.getColNode('emp_name11')!.colspan).toBe(2)
      expect(store.getColNode('job_name')!.colspan).toBe(7)
      expect(store.sumWidth).toBe(before - 100)
    })

    it('子项全部 hide 时父级也 hide', () => {
      const store = createStore()
      store.setColHide('emp_name111', true)
      store.setColHide('emp_name112', true)
      store.setColHide('emp_name113', true)
      expect(store.getColNode('emp_name11')!.hide).toBe(true)
      expect(store.getColNode('emp_name11')!.width).toBe(0)
      expect(store.getColNode('emp_name11')!.colspan).toBe(0)
    })

    it('配置 hide 初始化生效', () => {
      const store = createStore({
        columns: [
          { key: 'a', title: 'A', width: 100 },
          { key: 'b', title: 'B', width: 100, hide: true },
        ],
        data: [],
      })
      expect(store.getColNode('b')!.hide).toBe(true)
      expect(store.sumWidth).toBe(100)
    })
  })

  describe('列 sort', () => {
    it('应按 sort 对同级列排序', () => {
      const store = createStore({
        columns: [
          { key: 'c', title: 'C', sort: 3 },
          { key: 'a', title: 'A', sort: 1 },
          { key: 'b', title: 'B', sort: 2 },
        ],
        data: [],
      })
      expect(store.colNodes.map((c) => c.key)).toEqual(['a', 'b', 'c'])
    })

    it('setColSort 应调整同级顺序', () => {
      const store = createStore({
        columns: [
          { key: 'a', title: 'A', sort: 1 },
          { key: 'b', title: 'B', sort: 2 },
        ],
        data: [],
      })
      store.setColSort('a', 5)
      expect(store.colNodes.map((c) => c.key)).toEqual(['b', 'a'])
    })
  })

  describe('行 expand / rowIndex', () => {
    it('默认未展开时子行 rowIndex 为 -1', () => {
      const store = createStore()
      expect(store.getRowNode('1')!.rowIndex).toBe(0)
      expect(store.getRowNode('2')!.rowIndex).toBe(1)
      expect(store.getRowNode('1-1')!.rowIndex).toBe(-1)
      expect(store.getRowNode('1-2-1')!.rowIndex).toBe(-1)
    })

    it('展开后应更新 rowIndex 与 sumHeight', () => {
      const store = createStore()
      store.setExpand('1', true)
      expect(store.getRowNode('1')!.expand).toBe(true)
      expect(store.getRowNode('1-1')!.rowIndex).toBe(1)
      expect(store.getRowNode('1-2')!.rowIndex).toBe(2)
      expect(store.getRowNode('2')!.rowIndex).toBe(3)
      // 顶层 2 + 展开节点 1 的直接子行 2 = 4 * 16
      expect(store.sumHeight).toBe(64)

      store.setExpand('1-2', true)
      expect(store.getRowNode('1-2-1')!.rowIndex).toBe(3)
      expect(store.getRowNode('1-2-2')!.rowIndex).toBe(4)
      expect(store.getRowNode('2')!.rowIndex).toBe(5)
      expect(store.sumHeight).toBe(96)
    })
  })

  describe('行勾选', () => {
    it('勾选子节点应向上联动 indeterminate / checked', () => {
      const store = createStore()
      store.setChecked('1-2-1', 'checked')
      expect(store.getRowNode('1-2-1')!.getCheckState()).toBe('checked')
      expect(store.getRowNode('1-2')!.getCheckState()).toBe('indeterminate')
      expect(store.getRowNode('1')!.getCheckState()).toBe('indeterminate')

      store.setChecked('1-2-2', 'checked')
      expect(store.getRowNode('1-2')!.getCheckState()).toBe('checked')
    })

    it('勾选父节点应向下同步子节点', () => {
      const store = createStore()
      store.setChecked('1', 'checked')
      expect(store.getRowNode('1-1')!.getCheckState()).toBe('checked')
      expect(store.getRowNode('1-2')!.getCheckState()).toBe('checked')
      expect(store.getRowNode('1-2-1')!.getCheckState()).toBe('checked')
      expect(store.getRowNode('1-2-2')!.getCheckState()).toBe('checked')
    })

    it('rowSelectable 返回 false 时不可勾选', () => {
      const store = createStore()
      store.rowSelectable = ({ row }) => row.id !== '1-2-1'
      store.setChecked('1-2-1', 'checked')
      expect(store.getRowNode('1-2-1')!.getCheckState()).toBe('unchecked')
    })
  })

  describe('getNodeDataTree', () => {
    it('应输出树形调试数据', () => {
      const store = createStore()
      const tree = store.getNodeDataTree()
      expect(tree).toHaveLength(2)
      expect(tree[0]).toMatchObject({
        key: '1',
        level: 0,
        rowIndex: 0,
        hasChildren: true,
        expand: false,
        parentKey: 'root_evt',
      })
      expect(tree[0].children).toHaveLength(2)
    })
  })

  describe('列 fixed', () => {
    function createFixedStore() {
      return new Store({
        columns: [
          { key: 'emp_no', title: '工号', width: 120, fixed: 'left' },
          { key: 'emp_name', title: '姓名', width: 100 },
          {
            key: 'job_name',
            title: '岗位',
            children: [
              { key: 'job_a', title: '岗位A', fixed: 'left' },
              { key: 'job_b', title: '岗位B' },
            ],
          },
          { key: 'ops', title: '操作', width: 80, fixed: 'right' },
        ],
        data: [{ id: '1', emp_no: '1', children: [] }],
      })
    }

    it('配置 fixed 初始化生效', () => {
      const store = createFixedStore()
      expect(store.getColNode('emp_no')!.fixed).toBe('left')
      expect(store.getColNode('emp_name')!.fixed).toBe('')
      expect(store.getColNode('job_a')!.fixed).toBe('left')
      expect(store.getColNode('job_b')!.fixed).toBe('')
      expect(store.getColNode('ops')!.fixed).toBe('right')
    })

    it('未配置 fixed 时默认为空字符串', () => {
      const store = createStore({
        columns: [{ key: 'a', title: 'A' }],
        data: [],
      })
      expect(store.getColNode('a')!.fixed).toBe('')
    })

    it('setColFixed 应更新列固定方向', () => {
      const store = createFixedStore()
      store.setColFixed('emp_name', 'left')
      expect(store.getColNode('emp_name')!.fixed).toBe('left')

      store.setColFixed('emp_no', 'right')
      expect(store.getColNode('emp_no')!.fixed).toBe('right')

      store.setColFixed('ops', '')
      expect(store.getColNode('ops')!.fixed).toBe('')
    })

    it('setColFixed 对不存在的列不应抛错', () => {
      const store = createFixedStore()
      expect(() => store.setColFixed('not_exist', 'left')).not.toThrow()
    })
  })
})
