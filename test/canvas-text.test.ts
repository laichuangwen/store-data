import { describe, expect, it, vi } from 'vitest'
import { Icon, Paint, Text, type TextConfig } from '../src/canvas-text'

function createMockCtx(charWidth = 8) {
  const measureText = vi.fn((text: string) => ({
    width: text.length * charWidth,
    actualBoundingBoxAscent: 10,
    actualBoundingBoxDescent: 2,
  }))

  return {
    font: '',
    fillStyle: '#000',
    strokeStyle: '#000',
    lineWidth: 1,
    textAlign: 'left' as CanvasTextAlign,
    textBaseline: 'alphabetic' as CanvasTextBaseline,
    measureText,
    fillText: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    closePath: vi.fn(),
    setLineDash: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    drawImage: vi.fn(),
    canvas: document.createElement('canvas'),
  } as unknown as CanvasRenderingContext2D
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  config: Omit<TextConfig, 'text'>
) {
  const paint = new Paint(ctx)
  return new Text(paint, { ...config, text }).draw()
}

describe('canvas-text', () => {
  it('draw returns height for multiline text', () => {
    const ctx = createMockCtx()
    const { height } = drawText(ctx, 'Hello World from canvas-text demo', {
      x: 20,
      y: 20,
      width: 80,
      height: 200,
      fontSize: 16,
      align: 'left',
      verticalAlign: 'top',
    })
    expect(height).toBeGreaterThan(0)
    expect(ctx.fillText).toHaveBeenCalled()
  })

  it('draw returns 0 for invalid box', () => {
    const ctx = createMockCtx()
    expect(
      drawText(ctx, 'x', { x: 0, y: 0, width: 0, height: 100, fontSize: 14 })
        .height
    ).toBe(0)
    expect(ctx.fillText).not.toHaveBeenCalled()
  })

  it('draw applies color and debug strokes', () => {
    const ctx = createMockCtx()
    drawText(ctx, 'Hi', {
      x: 10,
      y: 10,
      width: 100,
      height: 100,
      fontSize: 14,
      color: '#ff0000',
      debug: true,
      align: 'center',
      verticalAlign: 'middle',
    })
    expect(ctx.fillStyle).toBe('#ff0000')
    expect(ctx.stroke).toHaveBeenCalled()
    expect(ctx.rect).toHaveBeenCalled()
  })

  it('wraps by width and keeps newlines', () => {
    const ctx = createMockCtx(10)
    const { lines, flatText } = drawText(ctx, 'one\ntwo three four five six', {
      x: 0,
      y: 0,
      width: 40,
      height: 200,
      fontSize: 14,
      lineHeight: 12,
      align: 'left',
      verticalAlign: 'top',
    })
    expect(flatText.split('\n')[0]).toBe('one')
    expect(lines).toBeGreaterThan(2)
  })

  it('does not wrap early at spaces in CJK text', () => {
    const ctx = createMockCtx(8)
    // 每个字符 8px；宽度 48 可放下 6 个字符
    // 旧逻辑会在「API 」后的空格提前断行；新逻辑应按宽度尽量排满
    const { flatText } = drawText(ctx, 'API 对多行文本', {
      x: 0,
      y: 0,
      width: 48,
      height: 200,
      fontSize: 14,
      lineHeight: 12,
      align: 'left',
      verticalAlign: 'top',
    })
    const rows = flatText.split('\n')
    expect(rows[0]).toBe('API 对多')
    expect(rows[0].includes(' ')).toBe(true)
  })

  it('still wraps at spaces to avoid breaking Latin words', () => {
    const ctx = createMockCtx(8)
    // width=40 → 5 chars；'hello world' 在 w 处若硬拆会断单词，应在空格断
    const { flatText } = drawText(ctx, 'hello world', {
      x: 0,
      y: 0,
      width: 40,
      height: 200,
      fontSize: 14,
      lineHeight: 12,
      align: 'left',
      verticalAlign: 'top',
    })
    expect(flatText.split('\n')[0]).toBe('hello')
    expect(flatText.split('\n')[1]).toBe('world')
  })

  it('keeps continuous string within width', () => {
    const ctx = createMockCtx(8)
    const width = 40
    const { flatText } = drawText(ctx, '1'.repeat(40), {
      x: 0,
      y: 0,
      width,
      height: 400,
      fontSize: 14,
      lineHeight: 12,
      align: 'left',
      verticalAlign: 'top',
    })
    const lines = flatText.split('\n')
    expect(lines.length).toBeGreaterThan(1)
    for (const line of lines) {
      expect(ctx.measureText(line).width).toBeLessThanOrEqual(width)
    }
  })

  it('padding shrinks content box for wrapping', () => {
    const ctx = createMockCtx(8)
    const noPad = drawText(ctx, 'abcdefghijklmnop', {
      x: 0,
      y: 0,
      width: 100,
      height: 200,
      fontSize: 14,
      align: 'left',
      verticalAlign: 'top',
      padding: 0,
    })
    const withPad = drawText(ctx, 'abcdefghijklmnop', {
      x: 0,
      y: 0,
      width: 100,
      height: 200,
      fontSize: 14,
      align: 'left',
      verticalAlign: 'top',
      padding: 20,
    })
    expect(withPad.lines).toBeGreaterThan(noPad.lines)
  })

  it('maxLineClamp truncates with ellipsis', () => {
    const ctx = createMockCtx(8)
    const result = drawText(ctx, 'one two three four five six seven eight', {
      x: 0,
      y: 0,
      width: 40,
      height: 200,
      fontSize: 14,
      align: 'left',
      verticalAlign: 'top',
      maxLineClamp: 2,
    })
    expect(result.clamped).toBe(true)
    expect(result.lines).toBe(2)
    const lastCall = vi.mocked(ctx.fillText).mock.calls.at(-1)
    expect(lastCall?.[0]).toContain('...')
  })

  it('clamps by box height when autoRowHeight is false', () => {
    const ctx = createMockCtx(8)
    // charHeight from mock ascent = 12; height 30 fits at most 2 lines
    const result = drawText(ctx, 'one two three four five six seven eight', {
      x: 0,
      y: 0,
      width: 40,
      height: 30,
      fontSize: 14,
      lineHeight: 12,
      align: 'left',
      verticalAlign: 'top',
      autoRowHeight: false,
    })
    expect(result.clamped).toBe(true)
    expect(result.lines).toBeLessThanOrEqual(2)
    expect(result.neededHeight).toBeGreaterThan(result.height)
  })

  it('autoRowHeight callbacks needed box height when overflowing', () => {
    const ctx = createMockCtx(8)
    const onAutoHeight = vi.fn()
    const result = drawText(ctx, 'one two three four five six seven eight', {
      x: 0,
      y: 0,
      width: 40,
      height: 30,
      fontSize: 14,
      lineHeight: 12,
      padding: 4,
      align: 'left',
      verticalAlign: 'top',
      autoRowHeight: true,
      onAutoHeight,
    })
    expect(result.clamped).toBe(false)
    expect(result.neededHeight).toBeGreaterThan(30 - 8)
    expect(onAutoHeight).toHaveBeenCalledTimes(1)
    expect(onAutoHeight.mock.calls[0][0]).toBe(result.neededHeight + 8)
  })

  it('height clamp keeps complete lines with ellipsis, no clip', () => {
    const ctx = createMockCtx(8)
    const result = drawText(ctx, 'one two three four five six seven eight', {
      x: 0,
      y: 0,
      width: 40,
      height: 30,
      fontSize: 14,
      lineHeight: 12,
      align: 'left',
      verticalAlign: 'top',
      autoRowHeight: false,
    })
    expect(result.clamped).toBe(true)
    expect(result.lines).toBe(2)
    expect(ctx.clip).not.toHaveBeenCalled()
    const lastCall = vi.mocked(ctx.fillText).mock.calls.at(-1)
    expect(lastCall?.[0]).toContain('...')
  })

  it('keeps blank newline gaps between lines when verticalAlign is bottom', () => {
    const ctx = createMockCtx(8)
    const lineHeight = 12
    drawText(ctx, 'hello\n\nworld', {
      x: 0,
      y: 0,
      width: 200,
      height: 100,
      fontSize: 14,
      lineHeight,
      align: 'left',
      verticalAlign: 'bottom',
    })
    const calls = vi.mocked(ctx.fillText).mock.calls
    expect(calls).toHaveLength(2)
    expect(calls[0][0]).toBe('hello')
    expect(calls[1][0]).toBe('world')
    // 中间空行占一行高度：world 相对 hello 下移 2 * lineHeight
    expect(calls[1][2] - calls[0][2]).toBe(lineHeight * 2)
  })

  it('hitTest and getSelectedText support drag selection', () => {
    const ctx = createMockCtx(8)
    const view = new Text(new Paint(ctx), {
      text: 'abc\ndef',
      x: 0,
      y: 0,
      width: 200,
      height: 100,
      fontSize: 14,
      lineHeight: 12,
      align: 'left',
      verticalAlign: 'top',
      padding: 0,
      selection: { start: 1, end: 5 },
    })
    view.draw()
    expect(view.getFlatText()).toBe('abc\ndef')
    expect(view.getSelectedText()).toBe('bc\nd')
    // 第一行 a:[0,8) mid=4, b:[8,16) mid=12 → x=10 落在 b
    expect(view.hitTest(10, 6)).toBe(1)
    // 第二行 y=12..24，点在行首
    expect(view.hitTest(0, 18)).toBe(4)
  })

  it('draws selection highlight with fillRect', () => {
    const ctx = createMockCtx()
    drawText(ctx, 'hello', {
      x: 0,
      y: 0,
      width: 200,
      height: 50,
      fontSize: 14,
      lineHeight: 12,
      align: 'left',
      verticalAlign: 'top',
      selection: { start: 1, end: 4 },
    })
    expect(ctx.fillRect).toHaveBeenCalled()
  })

  it('truncation ellipsis cannot be selected or copied', () => {
    const ctx = createMockCtx(8)
    const view = new Text(new Paint(ctx), {
      text: 'one two three four five six seven eight',
      x: 0,
      y: 0,
      width: 40,
      height: 200,
      fontSize: 14,
      lineHeight: 12,
      align: 'left',
      verticalAlign: 'top',
      maxLineClamp: 2,
      selection: { start: 0, end: 999 },
    })
    view.draw()
    const flat = view.getFlatText()
    expect(flat.endsWith('...')).toBe(true)
    const selected = view.getSelectedText()
    expect(selected.endsWith('...')).toBe(false)
    expect(selected.includes('...')).toBe(false)

    const ellipsisStart = flat.length - 3
    const lastLine = flat.split('\n').at(-1)!
    const lastLineY = 12 + 6
    const ellLeft = (lastLine.length - 3) * 8
    // 点在省略号上仍停在省略号前
    expect(view.hitTest(ellLeft + 4, lastLineY)).toBe(ellipsisStart)
    expect(view.hitTest(lastLine.length * 8 + 10, lastLineY)).toBe(
      ellipsisStart
    )
  })

  it('beforeIcons and afterIcons are inline on first/last line only', () => {
    const ctx = createMockCtx(8)
    const paint = new Paint(ctx)
    const img = document.createElement('img')

    const before = new Icon(paint, {
      source: img,
      name: 'before',
      x: 0,
      y: 0,
      width: 16,
      height: 16,
    })
    const after = new Icon(paint, {
      source: img,
      name: 'after',
      x: 0,
      y: 0,
      width: 16,
      height: 16,
    })

    const view = new Text(paint, {
      text: 'Hi',
      x: 0,
      y: 0,
      width: 200,
      height: 40,
      fontSize: 14,
      lineHeight: 12,
      align: 'left',
      verticalAlign: 'top',
      padding: 0,
      iconGap: 4,
      beforeIcons: [before],
      afterIcons: [after],
    })
    view.draw()

    // 前置占 20，文字从 20 起；后置紧跟文字终点（不额外折行）
    expect(before.x).toBe(0)
    expect(after.x).toBe(20 + 2 * 8 + 4)
    expect(view.getIcons()).toHaveLength(2)
    expect(ctx.drawImage).toHaveBeenCalled()
  })

  it('middle lines use full width without side icon gutters', () => {
    const ctx = createMockCtx(8)
    const paint = new Paint(ctx)
    const img = document.createElement('img')
    const before = new Icon(paint, {
      source: img,
      name: 'before',
      x: 0,
      y: 0,
      width: 16,
      height: 16,
    })
    const after = new Icon(paint, {
      source: img,
      name: 'after',
      x: 0,
      y: 0,
      width: 16,
      height: 16,
    })

    const view = new Text(paint, {
      text: 'aaaaaaaaaaaaaaaaaaaaaaaa',
      x: 0,
      y: 0,
      width: 80,
      height: 200,
      fontSize: 14,
      lineHeight: 12,
      align: 'left',
      verticalAlign: 'top',
      padding: 0,
      iconGap: 4,
      beforeIcons: [before],
      afterIcons: [after],
    })
    view.draw()
    const flat = view.getFlatText()
    const rows = flat.split('\n')
    expect(rows.length).toBeGreaterThan(1)

    // 第二行左对齐应从 contentX=0 起（无左侧占位）
    const secondY = 12 + 6
    expect(view.hitTest(1, secondY)).toBe(rows[0].length + 1)

    // 后置紧跟末行文字终点，不为此多折出孤立字符行
    const last = rows[rows.length - 1]
    expect(last.length).toBeGreaterThan(1)
    expect(after.x).toBe(0 + last.length * 8 + 4)
  })

  it('afterIcons follow horizontal align on the last line', () => {
    const ctx = createMockCtx(8)
    const paint = new Paint(ctx)
    const img = document.createElement('img')
    const after = new Icon(paint, {
      source: img,
      name: 'after',
      x: 0,
      y: 0,
      width: 16,
      height: 16,
    })

    const view = new Text(paint, {
      text: 'Hi',
      x: 0,
      y: 0,
      width: 200,
      height: 40,
      fontSize: 14,
      lineHeight: 12,
      align: 'right',
      verticalAlign: 'top',
      padding: 0,
      iconGap: 4,
      afterIcons: [after],
    })
    view.draw()

    // 右对齐：文字+后置整体靠右，图标贴内容区右缘
    expect(after.x + after.width).toBe(200)
    // 文字在图标左侧：'Hi'=16, gap=4 → text 右缘 = after.x - 4
    expect(after.x).toBe(200 - 16)
  })

  it('empty text keeps before/after icons on the same row', () => {
    const ctx = createMockCtx(8)
    const paint = new Paint(ctx)
    const img = document.createElement('img')
    const before = new Icon(paint, {
      source: img,
      name: 'before',
      x: 0,
      y: 0,
      width: 16,
      height: 16,
    })
    const after = new Icon(paint, {
      source: img,
      name: 'after',
      x: 0,
      y: 0,
      width: 16,
      height: 16,
    })

    const view = new Text(paint, {
      text: '',
      x: 0,
      y: 0,
      width: 200,
      height: 80,
      fontSize: 14,
      lineHeight: 12,
      align: 'center',
      verticalAlign: 'middle',
      padding: 0,
      iconGap: 4,
      beforeIcons: [before],
      afterIcons: [after],
    })
    view.draw()

    // 无文字时前后图标同一行，不应上下错行
    expect(before.y).toBe(after.y)
    expect(after.x).toBe(before.x + before.width + 4)
  })

  it('right align wraps afterIcons to next line when row would overflow left', () => {
    const ctx = createMockCtx(8)
    const paint = new Paint(ctx)
    const img = document.createElement('img')
    const before = new Icon(paint, {
      source: img,
      name: 'before',
      x: 0,
      y: 0,
      width: 16,
      height: 16,
    })
    const after = new Icon(paint, {
      source: img,
      name: 'after',
      x: 0,
      y: 0,
      width: 16,
      height: 16,
    })

    // 内容宽 80；前置 20；文字一行可到 60；再加后置 20 → 同行放不下
    const view = new Text(paint, {
      text: '1234567', // 56px，接近占满前置后的行宽
      x: 0,
      y: 0,
      width: 80,
      height: 200,
      fontSize: 14,
      lineHeight: 12,
      align: 'right',
      verticalAlign: 'top',
      padding: 0,
      iconGap: 4,
      beforeIcons: [before],
      afterIcons: [after],
    })
    view.draw()

    // 后置换到下一行并右对齐，前置不再被挤出左边界
    expect(before.x).toBeGreaterThanOrEqual(0)
    expect(after.y).toBeGreaterThan(before.y)
    expect(after.x + after.width).toBe(80)
  })

  it('afterIcons stay inside box when last line is truncated', () => {
    const ctx = createMockCtx(8)
    const paint = new Paint(ctx)
    const img = document.createElement('img')
    const after = new Icon(paint, {
      source: img,
      name: 'after',
      x: 0,
      y: 0,
      width: 16,
      height: 16,
    })

    const view = new Text(paint, {
      text: 'one two three four five six seven eight',
      x: 0,
      y: 0,
      width: 80,
      height: 200,
      fontSize: 14,
      lineHeight: 12,
      align: 'left',
      verticalAlign: 'top',
      padding: 0,
      iconGap: 4,
      maxLineClamp: 1,
      afterIcons: [after],
    })
    view.draw()

    const flat = view.getFlatText()
    expect(flat.endsWith('...')).toBe(true)
    // 末行为后置留宽：文字+gap+图标不超过内容区
    expect(after.x + after.width).toBeLessThanOrEqual(80)
    expect(after.x).toBeGreaterThanOrEqual(0)
  })

  it('afterIcons move to next line alone when same line would overflow', () => {
    const ctx = createMockCtx(8)
    const paint = new Paint(ctx)
    const img = document.createElement('img')
    const after = new Icon(paint, {
      source: img,
      name: 'after',
      x: 0,
      y: 0,
      width: 16,
      height: 16,
    })

    // 一整行铺满且未截断：后置换到下一行，不夹带字符
    const view = new Text(paint, {
      text: '123456',
      x: 0,
      y: 0,
      width: 48,
      height: 200,
      fontSize: 14,
      lineHeight: 12,
      align: 'left',
      verticalAlign: 'top',
      padding: 0,
      iconGap: 4,
      afterIcons: [after],
    })
    const result = view.draw()
    expect(result.lines).toBe(1)
    expect(view.getFlatText()).toBe('123456')
    expect(after.x).toBe(0)
    // 下一行起点 y=12，图标相对行高垂直居中 → (12-16)/2 = -2
    expect(after.y).toBe(12 + (12 - 16) / 2)
    expect(after.x + after.width).toBeLessThanOrEqual(48)
  })

  it('bottom align pushes text up when afterIcons wrap to next line', () => {
    const ctx = createMockCtx(8)
    const paint = new Paint(ctx)
    const img = document.createElement('img')
    const before = new Icon(paint, {
      source: img,
      name: 'before',
      x: 0,
      y: 0,
      width: 16,
      height: 16,
    })
    const after = new Icon(paint, {
      source: img,
      name: 'after',
      x: 0,
      y: 0,
      width: 16,
      height: 16,
    })

    const view = new Text(paint, {
      text: '1234567',
      x: 0,
      y: 0,
      width: 80,
      height: 60,
      fontSize: 14,
      lineHeight: 12,
      align: 'left',
      verticalAlign: 'bottom',
      padding: 0,
      iconGap: 4,
      beforeIcons: [before],
      afterIcons: [after],
    })
    const result = view.draw()

    // 文字 1 行 + 后置单独 1 行 = 24，bottom 时整块贴底，文字上移
    expect(result.height).toBe(24)
    expect(before.y).toBeLessThan(after.y)
    // 后置行在内容区底部（图标相对行高居中可能略超出）
    expect(after.y).toBeGreaterThanOrEqual(60 - 12 - 2)
    expect(before.y).toBe(60 - 24 + (12 - 16) / 2)
  })
})
