import { describe, expect, it, vi } from 'vitest'
import { Paint, Text, type TextConfig } from '../src/canvas-text'

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
    setLineDash: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
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
    expect(ctx.strokeRect).toHaveBeenCalled()
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
    const onHeight = vi.fn()
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
      onHeight,
    })
    expect(result.clamped).toBe(false)
    expect(result.neededHeight).toBeGreaterThan(30 - 8)
    expect(onHeight).toHaveBeenCalledTimes(1)
    expect(onHeight.mock.calls[0][0]).toBe(result.neededHeight + 8)
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
})
