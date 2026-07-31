import { Icon } from './Icon'
import { Paint } from './Paint'
import { Shape, type ShapeConfig } from './Shape'

export type TextAlign = 'left' | 'center' | 'right'
export type VerticalAlign = 'top' | 'middle' | 'bottom'

/** 四边内边距；传 number 时四边相同 */
export type PaddingInput =
  | number
  | {
      top?: number
      right?: number
      bottom?: number
      left?: number
    }

export interface Padding {
  top: number
  right: number
  bottom: number
  left: number
}

export interface TextConfig extends ShapeConfig {
  /** 文本内容 */
  text: string
  /** 内边距（相对文本框） */
  padding?: PaddingInput
  /** 最大行数；超出后截断并追加省略号 */
  maxLineClamp?: number
  /**
   * 为 true 时不按区域高度截断；内容超出时通过 onHeight 回传所需总高度。
   * 为 false（默认）时文字不得超过区域高度，超出自动截断。
   */
  autoRowHeight?: boolean
  /** autoRowHeight 且内容超高时回调所需总高度（含 padding） */
  onHeight?: (height: number) => void
  /** 绘制调试辅助线 */
  debug?: boolean
  /** 水平对齐 */
  align?: TextAlign
  /** 垂直对齐 */
  verticalAlign?: VerticalAlign
  /** 字号（px） */
  fontSize?: number
  /** 字重，如 'bold' / '600' */
  fontWeight?: string
  /** 字体样式，如 'italic' */
  fontStyle?: string
  /** 字体变体，如 'small-caps' */
  fontVariant?: string
  /** 字体族 */
  font?: string
  /** 行高（px）；不传则按字体测量 */
  lineHeight?: number
  /** 填充颜色 */
  color?: string
  /** 选区（扁平文本下标，end 不含）；用于高亮 */
  selection?: TextSelectionRange
  /** 选区背景色 */
  selectionColor?: string
  /**
   * 绘制文字前图标列表（内联于首行文字起点前；仅首行占位，其余行全宽）。
   * 构造时传入的 x/y 会被布局覆盖；width/height 决定图标尺寸。
   */
  beforeIcons?: Icon[]
  /**
   * 绘制文字后图标列表（跟随末行文字终点；末行会为图标留宽，放不下时单独换行且不夹带文字）。
   * 构造时传入的 x/y 会被布局覆盖；width/height 决定图标尺寸。
   */
  afterIcons?: Icon[]
  /** 图标间距（图标之间、图标与文字之间），默认 4 */
  iconGap?: number
}

/** 选区范围：基于布局扁平文本（行间以 \\n 连接）的下标 */
export interface TextSelectionRange {
  /** 起始下标（含） */
  start: number
  /** 结束下标（不含） */
  end: number
}

export interface DrawTextResult {
  /** 实际绘制文本总高度 */
  height: number
  /** 完整内容所需文本高度（截断前） */
  neededHeight: number
  /** 实际绘制行数 */
  lines: number
  /** 是否被截断（maxLineClamp 或区域高度） */
  clamped: boolean
  /** 布局扁平文本（与 hitTest / 选区下标一致） */
  flatText: string
}

export interface SplitTextProps {
  ctx: CanvasRenderingContext2D
  text: string
  width: number
  /** 首行可用宽度；用于前置图标内联占位，默认与 width 相同 */
  firstLineWidth?: number
}

export interface GetTextHeightProps {
  ctx: CanvasRenderingContext2D
  text: string
  style: string
  /** 测量失败时的回退高度 */
  fallback?: number
}

interface ContentBox {
  x: number
  y: number
  width: number
  height: number
  contentX: number
  contentY: number
  contentWidth: number
  contentHeight: number
  contentXEnd: number
  contentYEnd: number
  /** 前置图标占用宽度（仅首行），含与文字间距 */
  beforeIconsWidth: number
  /** 后置图标占用宽度（仅末行），含与文字间距 */
  afterIconsWidth: number
}

interface LayoutLine {
  text: string
  x: number
  y: number
  width: number
  height: number
  /** 字符左边缘相对 line.x；长度 = text.length + 1 */
  edges: number[]
  /** 该行首字符在扁平文本中的下标 */
  flatStart: number
  /**
   * 截断省略号起始下标（行内）；null 表示无溢出省略号。
   * 溢出省略号不可选中、不可复制。
   */
  ellipsisStart: number | null
}

interface TextLayout {
  lines: LayoutLine[]
  flatText: string
  charHeight: number
  textAnchor: number
  startY: number
  neededHeight: number
  clamped: boolean
  /** 后置图标是否单独占一行（影响垂直对齐总高度） */
  afterOnNextLine: boolean
}

const ELLIPSIS = '...'
const DEFAULT_SELECTION_COLOR = '#B4D7FF'

const defaultTextOptions = {
  debug: false,
  align: 'center' as TextAlign,
  verticalAlign: 'middle' as VerticalAlign,
  fontSize: 14,
  fontWeight: '',
  fontStyle: '',
  fontVariant: '',
  font: 'Arial',
  lineHeight: undefined as number | undefined,
  color: undefined as string | undefined,
  padding: 0 as PaddingInput,
  maxLineClamp: undefined as number | undefined,
  autoRowHeight: false,
  onHeight: undefined as ((height: number) => void) | undefined,
  selection: undefined as TextSelectionRange | undefined,
  selectionColor: DEFAULT_SELECTION_COLOR,
  iconGap: 4,
}

type ResolvedTextOptions = typeof defaultTextOptions

const EMPTY_LAYOUT: TextLayout = {
  lines: [],
  flatText: '',
  charHeight: 0,
  textAnchor: 0,
  startY: 0,
  neededHeight: 0,
  clamped: false,
  afterOnNextLine: false,
}

const EMPTY_RESULT: DrawTextResult = {
  height: 0,
  neededHeight: 0,
  lines: 0,
  clamped: false,
  flatText: '',
}

function normalizePadding(padding: PaddingInput = 0): Padding {
  if (typeof padding === 'number') {
    return { top: padding, right: padding, bottom: padding, left: padding }
  }
  return {
    top: padding.top ?? 0,
    right: padding.right ?? 0,
    bottom: padding.bottom ?? 0,
    left: padding.left ?? 0,
  }
}

function linesHeight(lineCount: number, charHeight: number): number {
  return lineCount <= 0 ? 0 : charHeight * lineCount
}

/** 行内可选中字符数（不含溢出省略号） */
function selectableLength(line: LayoutLine): number {
  return line.ellipsisStart ?? line.text.length
}

/**
 * 测量单行文本高度（ascent + descent）。
 * 仅用 ascent 会偏小，导致行距低估、文字画出区域。
 */
function getTextHeight({
  ctx,
  text,
  style,
  fallback = 0,
}: GetTextHeightProps): number {
  const prevBaseline = ctx.textBaseline
  const prevFont = ctx.font

  ctx.textBaseline = 'alphabetic'
  ctx.font = style
  const metrics = ctx.measureText(text)
  const height =
    (metrics.actualBoundingBoxAscent || 0) +
    (metrics.actualBoundingBoxDescent || 0)

  ctx.textBaseline = prevBaseline
  ctx.font = prevFont

  return height > 0 ? height : fallback
}

/** 找到不超过 maxWidth 的最大字符数（至少 1） */
function findFitLength(
  measure: (value: string) => number,
  text: string,
  maxWidth: number
): number {
  if (text.length <= 1) return text.length
  if (measure(text) <= maxWidth) return text.length

  let low = 1
  let high = text.length
  while (low < high) {
    const mid = Math.ceil((low + high) / 2)
    if (measure(text.slice(0, mid)) <= maxWidth) low = mid
    else high = mid - 1
  }
  return Math.max(1, low)
}

function createMeasureCache(ctx: CanvasRenderingContext2D) {
  const cache = new Map<string, number>()
  return (value: string): number => {
    const hit = cache.get(value)
    if (hit !== undefined) return hit
    const width = ctx.measureText(value).width
    cache.set(value, width)
    return width
  }
}

/** 按宽度将文本拆成多行；支持 \\n；首行可使用更窄宽度（内联前置图标） */
function splitText({
  ctx,
  text,
  width,
  firstLineWidth,
}: SplitTextProps): string[] {
  const measure = createMeasureCache(ctx)
  const lines: string[] = []
  let isFirstLine = true

  const lineMaxWidth = () =>
    isFirstLine && firstLineWidth != null ? firstLineWidth : width

  for (const paragraph of text.split('\n')) {
    if (!paragraph) {
      lines.push('')
      isFirstLine = false
      continue
    }

    let remaining = paragraph
    while (remaining) {
      const maxW = lineMaxWidth()
      if (measure(remaining) <= maxW) {
        lines.push(remaining)
        isFirstLine = false
        break
      }

      let splitPoint = findFitLength(measure, remaining, maxW)
      // 仅当会从英文/数字单词中间断开时，才回退到最近空格；
      // 避免中英混排里普通空格被当成强制换行点、过早折行。
      if (
        splitPoint < remaining.length &&
        isAsciiWordChar(remaining[splitPoint - 1]) &&
        isAsciiWordChar(remaining[splitPoint])
      ) {
        const lastSpace = remaining.slice(0, splitPoint).lastIndexOf(' ')
        if (lastSpace > 0) splitPoint = lastSpace
      }

      let line = remaining.slice(0, splitPoint)
      // 防御：确保该行宽度不超过目标（浮点/字体测量误差）
      while (line.length > 1 && measure(line) > maxW) {
        line = line.slice(0, -1)
        splitPoint = line.length
      }

      // 若正好断在空格上，空格只作为断行点，不带到下一行行首
      remaining = remaining.slice(splitPoint).replace(/^\s+/, '')
      lines.push(line.trimEnd())
      isFirstLine = false
    }
  }

  return lines
}

function isAsciiWordChar(ch: string | undefined): boolean {
  if (!ch) return false
  const code = ch.charCodeAt(0)
  return (
    (code >= 48 && code <= 57) || // 0-9
    (code >= 65 && code <= 90) || // A-Z
    (code >= 97 && code <= 122) // a-z
  )
}

/** 将文本截断到宽度内并保证以省略号结尾 */
function truncateWithEllipsis(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (maxWidth <= 0) return ''

  const base = text.replace(/\.{3}$/, '').trimEnd()
  const withEllipsis = `${base}${ELLIPSIS}`
  if (ctx.measureText(withEllipsis).width <= maxWidth) return withEllipsis

  const ellipsisWidth = ctx.measureText(ELLIPSIS).width
  if (ellipsisWidth >= maxWidth) return ELLIPSIS

  let low = 0
  let high = base.length
  while (low < high) {
    const mid = Math.ceil((low + high) / 2)
    if (ctx.measureText(base.slice(0, mid)).width + ellipsisWidth <= maxWidth) {
      low = mid
    } else {
      high = mid - 1
    }
  }
  return `${base.slice(0, low).trimEnd()}${ELLIPSIS}`
}

function clampLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  maxLineClamp: number | undefined,
  contentWidth: number
): { lines: string[]; clamped: boolean } {
  if (maxLineClamp == null || lines.length <= maxLineClamp) {
    return { lines, clamped: false }
  }
  if (maxLineClamp <= 0) {
    return { lines: [], clamped: true }
  }

  const clamped = lines.slice(0, maxLineClamp)
  const last = clamped.length - 1
  clamped[last] = truncateWithEllipsis(ctx, clamped[last], contentWidth)
  return { lines: clamped, clamped: true }
}

/** 图标组自身宽度（含图标间距，不含与文字的间距） */
function iconsSpanWidth(icons: Icon[], gap: number): number {
  if (icons.length === 0) return 0
  let width = 0
  for (let i = 0; i < icons.length; i++) {
    width += icons[i].width
    if (i < icons.length - 1) width += gap
  }
  return width
}

/** 图标组占用的内容宽度（含与文字一侧的间距） */
function measureIconsWidth(icons: Icon[], gap: number): number {
  if (icons.length === 0) return 0
  return iconsSpanWidth(icons, gap) + gap
}

function measureEdges(
  ctx: CanvasRenderingContext2D,
  text: string
): number[] {
  const edges = [0]
  for (let i = 1; i <= text.length; i++) {
    edges.push(ctx.measureText(text.slice(0, i)).width)
  }
  return edges
}

/**
 * Canvas 多行文本绘制（自动换行、对齐、截断、划选）。
 */
export class Text extends Shape {
  text: string
  private readonly options: ResolvedTextOptions
  private readonly pad: Padding
  private readonly box: ContentBox
  private readonly beforeIcons: Icon[]
  private readonly afterIcons: Icon[]
  private layoutCache: TextLayout | null = null
  private result: DrawTextResult = EMPTY_RESULT

  constructor(paint: Paint, config: TextConfig) {
    super(paint, config)
    this.text = config.text
    this.options = { ...defaultTextOptions, ...config }
    this.pad = normalizePadding(this.options.padding)
    this.beforeIcons = (config.beforeIcons ?? []).filter((icon) => icon.visible)
    this.afterIcons = (config.afterIcons ?? []).filter((icon) => icon.visible)
    this.box = this.createContentBox()
  }

  /** 最近一次 draw / render 的结果 */
  getDrawResult(): DrawTextResult {
    return this.result
  }

  /** 前置图标（布局后 x/y 已更新，可用于 hitTest） */
  getBeforeIcons(): Icon[] {
    return this.beforeIcons
  }

  /** 后置图标（布局后 x/y 已更新，可用于 hitTest） */
  getAfterIcons(): Icon[] {
    return this.afterIcons
  }

  /** 前后图标合集 */
  getIcons(): Icon[] {
    return [...this.beforeIcons, ...this.afterIcons]
  }

  draw(): DrawTextResult {
    if (!this.visible) {
      this.result = EMPTY_RESULT
      return this.result
    }
    this.render(this.paint)
    return this.result
  }

  render(paint: Paint): void {
    if (!this.isValid()) {
      this.result = EMPTY_RESULT
      return
    }

    const ctx = paint.getCtx()
    const { options, pad } = this
    const layout = this.ensureLayout(ctx)
    const { lines, charHeight, textAnchor, flatText, neededHeight, clamped } =
      layout

    if (options.autoRowHeight) {
      const neededBoxHeight = neededHeight + pad.top + pad.bottom
      if (neededBoxHeight > this.height) {
        options.onHeight?.(neededBoxHeight)
      }
    }

    const drawnHeight =
      linesHeight(lines.length, charHeight) +
      (layout.afterOnNextLine ? charHeight : 0)
    this.layoutIcons(lines, layout.afterOnNextLine)

    this.paintSelection(ctx, layout)
    this.paintLines(ctx, lines, textAnchor)
    this.paintIcons()

    if (options.debug) {
      const { debugY } = this.resolveVerticalAlign(drawnHeight)
      this.drawDebug(textAnchor, debugY)
    }

    this.result = {
      height: drawnHeight,
      neededHeight,
      lines: lines.length,
      clamped,
      flatText,
    }
  }

  /**
   * 将画布坐标映射为扁平文本下标（用于划选）。
   * 返回 [0, flatText.length] 的插入位置。
   * 溢出省略号「...」不可选中，命中落在其上时对齐到省略号前。
   */
  hitTest(x: number, y: number): number {
    const layout = this.ensureLayout(this.paint.getCtx())
    const { lines } = layout
    if (lines.length === 0) return 0

    const first = lines[0]
    const last = lines[lines.length - 1]
    if (y < first.y) return 0
    if (y >= last.y + last.height) return this.getSelectableEnd(layout)

    const line = this.findLineAtY(lines, y)
    const limit = selectableLength(line)
    const localX = x - line.x

    if (localX <= 0) return line.flatStart
    // 行宽含省略号；点在可截取文本之后（含省略号区域）→ 停在省略号前
    if (localX >= line.edges[limit]) return line.flatStart + limit

    for (let i = 0; i < limit; i++) {
      if (localX < (line.edges[i] + line.edges[i + 1]) / 2) {
        return line.flatStart + i
      }
    }
    return line.flatStart + limit
  }

  /** 当前选区对应的文本（含换行） */
  getSelectedText(): string {
    const layout = this.ensureLayout(this.paint.getCtx())
    const range = this.normalizedSelection(layout.flatText.length)
    return range ? layout.flatText.slice(range.start, range.end) : ''
  }

  /** 布局扁平文本 */
  getFlatText(): string {
    return this.ensureLayout(this.paint.getCtx()).flatText
  }

  private ensureLayout(ctx: CanvasRenderingContext2D): TextLayout {
    if (this.layoutCache) return this.layoutCache
    if (!this.isValid()) {
      this.layoutCache = EMPTY_LAYOUT
      return this.layoutCache
    }

    const { options } = this
    const style = this.buildFontStyle()
    ctx.font = style

    const charHeight = this.measureCharHeight(ctx, style)
    const prepared = this.prepareLines(ctx, charHeight)
    const afterOnNextLine = this.willPlaceAfterOnNextLine(ctx, prepared.lines)
    // 后置换行时计入总高度，bottom / middle 才会把文字向上挤
    const drawnHeight =
      linesHeight(prepared.lines.length, charHeight) +
      (afterOnNextLine ? charHeight : 0)
    const textAnchor = this.applyHorizontalAlign(ctx)
    const { txtY: startY } = this.resolveVerticalAlign(drawnHeight)
    const { contentX, contentWidth, beforeIconsWidth, afterIconsWidth } =
      this.box
    const layoutLines: LayoutLine[] = []
    let flatStart = 0
    let txtY = startY
    const lineCount = prepared.lines.length
    const afterOnSameLine = !afterOnNextLine && this.afterIcons.length > 0

    for (let i = 0; i < lineCount; i++) {
      const text = prepared.lines[i].trimEnd()
      const width = text ? ctx.measureText(text).width : 0
      const lead = i === 0 ? beforeIconsWidth : 0
      const trail =
        i === lineCount - 1 && afterOnSameLine ? afterIconsWidth : 0
      const lineBoxX = contentX + lead
      const lineBoxW = Math.max(0, contentWidth - lead - trail)
      const x =
        options.align === 'right'
          ? lineBoxX + lineBoxW - width
          : options.align === 'left'
            ? lineBoxX
            : lineBoxX + (lineBoxW - width) / 2

      layoutLines.push({
        text,
        x,
        y: txtY,
        width,
        height: charHeight,
        edges: measureEdges(ctx, text),
        flatStart,
        ellipsisStart: null,
      })

      flatStart += text.length + (i < lineCount - 1 ? 1 : 0)
      txtY += charHeight
    }

    // 截断产生的溢出省略号不可选中、不可复制
    if (prepared.clamped && layoutLines.length > 0) {
      const lastLine = layoutLines[layoutLines.length - 1]
      if (lastLine.text.endsWith(ELLIPSIS)) {
        lastLine.ellipsisStart = lastLine.text.length - ELLIPSIS.length
      }
    }

    this.layoutCache = {
      lines: layoutLines,
      flatText: layoutLines.map((l) => l.text).join('\n'),
      charHeight,
      textAnchor,
      startY,
      neededHeight:
        prepared.neededHeight + (afterOnNextLine ? charHeight : 0),
      clamped: prepared.clamped,
      afterOnNextLine,
    }
    return this.layoutCache
  }

  /** 命中 y 所在行；夹在行间时取上方最近行 */
  private findLineAtY(lines: LayoutLine[], y: number): LayoutLine {
    let line = lines[0]
    for (const candidate of lines) {
      if (y >= candidate.y && y < candidate.y + candidate.height) return candidate
      if (y >= candidate.y) line = candidate
    }
    return line
  }

  /** 可选中文本的最大下标（不含溢出省略号） */
  private getSelectableEnd(layout: TextLayout): number {
    const line = layout.lines.find((l) => l.ellipsisStart != null)
    return line
      ? line.flatStart + line.ellipsisStart!
      : layout.flatText.length
  }

  /** 落在溢出省略号上的下标一律对齐到省略号前 */
  private excludeEllipsisIndex(index: number, lines: LayoutLine[]): number {
    for (const line of lines) {
      if (line.ellipsisStart == null) continue
      const ellStart = line.flatStart + line.ellipsisStart
      if (index > ellStart) return ellStart
    }
    return index
  }

  private normalizedSelection(
    flatLen?: number
  ): TextSelectionRange | null {
    const sel = this.options.selection
    if (!sel) return null

    const layout = this.ensureLayout(this.paint.getCtx())
    const len = Math.min(
      flatLen ?? layout.flatText.length,
      this.getSelectableEnd(layout)
    )
    let start = Math.max(0, Math.min(sel.start, sel.end, len))
    let end = Math.max(0, Math.min(Math.max(sel.start, sel.end), len))
    start = this.excludeEllipsisIndex(start, layout.lines)
    end = this.excludeEllipsisIndex(end, layout.lines)
    return start >= end ? null : { start, end }
  }

  private paintSelection(
    ctx: CanvasRenderingContext2D,
    layout: TextLayout
  ): void {
    const range = this.normalizedSelection(layout.flatText.length)
    if (!range) return

    const { options } = this
    const { start, end } = range
    const { lines, charHeight } = layout

    ctx.fillStyle = options.selectionColor || DEFAULT_SELECTION_COLOR

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const limit = selectableLength(line)
      const breakEnd =
        line.flatStart + line.text.length + (i < lines.length - 1 ? 1 : 0)

      if (end <= line.flatStart || start >= breakEnd || limit === 0) continue

      if (!line.text) {
        ctx.fillRect(line.x, line.y, Math.max(4, charHeight * 0.35), line.height)
        continue
      }

      const localStart = Math.max(0, start - line.flatStart)
      const localEnd = Math.min(limit, end - line.flatStart)
      if (localEnd <= localStart) continue

      const w = line.edges[localEnd] - line.edges[localStart]
      if (w > 0) ctx.fillRect(line.x + line.edges[localStart], line.y, w, line.height)
    }
  }

  private createContentBox(): ContentBox {
    const { x, y, width, height } = this
    const { left, top, right, bottom } = this.pad
    const contentX = x + left
    const contentY = y + top
    const contentWidth = width - left - right
    const contentHeight = height - top - bottom
    const gap = this.options.iconGap
    return {
      x,
      y,
      width,
      height,
      contentX,
      contentY,
      contentWidth,
      contentHeight,
      contentXEnd: contentX + contentWidth,
      contentYEnd: contentY + contentHeight,
      beforeIconsWidth: measureIconsWidth(this.beforeIcons, gap),
      afterIconsWidth: measureIconsWidth(this.afterIcons, gap),
    }
  }

  private isValid(): boolean {
    const { width, height } = this
    const { fontSize } = this.options
    const { contentWidth, contentHeight, beforeIconsWidth } = this.box
    const minTextWidth = Math.max(0, contentWidth - beforeIconsWidth)
    return (
      width > 0 &&
      height > 0 &&
      fontSize > 0 &&
      contentWidth > 0 &&
      contentHeight > 0 &&
      minTextWidth > 0
    )
  }

  private buildFontStyle(): string {
    const { fontStyle, fontVariant, fontWeight, fontSize, font } = this.options
    return `${fontStyle} ${fontVariant} ${fontWeight} ${fontSize}px ${font}`.trim()
  }

  private measureCharHeight(
    ctx: CanvasRenderingContext2D,
    style: string
  ): number {
    const { lineHeight, fontSize } = this.options
    if (lineHeight != null) return lineHeight
    return Math.max(
      getTextHeight({ ctx, text: 'Mg', style, fallback: fontSize }),
      fontSize
    )
  }

  private prepareLines(
    ctx: CanvasRenderingContext2D,
    charHeight: number
  ): {
    lines: string[]
    clamped: boolean
    neededHeight: number
  } {
    const { text, options, box } = this
    const { contentWidth, contentHeight, beforeIconsWidth, afterIconsWidth } =
      box

    const firstLineWidth = Math.max(0, contentWidth - beforeIconsWidth)
    const maxLinesByHeight = options.autoRowHeight
      ? undefined
      : Math.floor(contentHeight / charHeight)

    const lastLineMax = (lineCount: number) => {
      const lead = lineCount <= 1 ? beforeIconsWidth : 0
      return Math.max(0, contentWidth - lead - afterIconsWidth)
    }

    let lines = splitText({
      ctx,
      text,
      width: contentWidth,
      firstLineWidth,
    })
    let clamped = false

    if (options.maxLineClamp != null) {
      const n = Math.min(lines.length, options.maxLineClamp)
      ;({ lines, clamped } = clampLines(
        ctx,
        lines,
        options.maxLineClamp,
        lastLineMax(n)
      ))
    }

    const neededHeight = linesHeight(lines.length, charHeight)

    // 默认：不得超过区域高度，超出按整行截断（带省略号）
    if (
      maxLinesByHeight != null &&
      linesHeight(lines.length, charHeight) > contentHeight
    ) {
      const n = Math.min(lines.length, Math.max(0, maxLinesByHeight))
      ;({ lines, clamped } = clampLines(
        ctx,
        lines,
        maxLinesByHeight,
        lastLineMax(n)
      ))
    }

    // 末行放不下后置图标时：若不能再折行则缩短末行；能折则留给 layoutIcons 单独一行放图标（不夹带字符）
    if (afterIconsWidth > 0 && lines.length > 0) {
      const lastMax = lastLineMax(lines.length)
      const last = lines[lines.length - 1]
      if (ctx.measureText(last).width > lastMax) {
        const hitLineClamp =
          options.maxLineClamp != null &&
          lines.length >= options.maxLineClamp
        const hitHeightClamp =
          maxLinesByHeight != null && lines.length >= maxLinesByHeight
        if (clamped || hitLineClamp || hitHeightClamp) {
          lines[lines.length - 1] = truncateWithEllipsis(ctx, last, lastMax)
          clamped = true
        }
      }
    }

    return { lines, clamped, neededHeight }
  }

  private applyHorizontalAlign(ctx: CanvasRenderingContext2D): number {
    const { options, box } = this
    const { contentX, contentXEnd, contentWidth } = box

    if (options.align === 'right') {
      ctx.textAlign = 'right'
      return contentXEnd
    }
    if (options.align === 'left') {
      ctx.textAlign = 'left'
      return contentX
    }
    ctx.textAlign = 'center'
    return contentX + contentWidth / 2
  }

  private resolveVerticalAlign(drawnHeight: number): {
    txtY: number
    debugY: number
  } {
    const { verticalAlign } = this.options
    const { contentY, contentYEnd, contentHeight } = this.box

    if (verticalAlign === 'bottom') {
      return { txtY: contentYEnd - drawnHeight, debugY: contentYEnd }
    }
    if (verticalAlign === 'middle') {
      return {
        txtY: contentY + (contentHeight - drawnHeight) / 2,
        debugY: contentY + contentHeight / 2,
      }
    }
    return { txtY: contentY, debugY: contentY }
  }

  /**
   * 末行是否还能与后置图标同行：
   * 前置(仅单行时) + 末行文字 + 后置 ≤ 内容宽。
   */
  private canPlaceAfterOnSameLine(
    ctx: CanvasRenderingContext2D,
    lines: string[]
  ): boolean {
    if (this.afterIcons.length === 0 || lines.length === 0) return false
    const { contentWidth, beforeIconsWidth, afterIconsWidth } = this.box
    const last = lines[lines.length - 1].trimEnd()
    const lastWidth = last ? ctx.measureText(last).width : 0
    const lead = lines.length === 1 ? beforeIconsWidth : 0
    return lastWidth + afterIconsWidth <= contentWidth - lead + 0.5
  }

  /** 有可见文字且末行放不下后置时，后置单独占一行 */
  private willPlaceAfterOnNextLine(
    ctx: CanvasRenderingContext2D,
    lines: string[]
  ): boolean {
    if (this.afterIcons.length === 0) return false
    if (!lines.some((line) => line.trimEnd().length > 0)) return false
    return !this.canPlaceAfterOnSameLine(ctx, lines)
  }

  /**
   * 前置贴首行文字起点；后置贴末行文字终点，并跟随水平 align。
   * 同行放不下则后置换到下一行，仍按 align 对齐。
   * 无可见文字时，前后图标同一行按 align 排布。
   */
  private layoutIcons(lines: LayoutLine[], afterOnNextLine: boolean): void {
    const { contentX, contentXEnd, contentWidth, contentY, contentHeight } =
      this.box
    const gap = this.options.iconGap
    const align = this.options.align

    const placeIconRow = (
      icons: Icon[],
      startX: number,
      lineY: number,
      lineH: number
    ) => {
      let x = startX
      for (const icon of icons) {
        icon.x = x
        icon.y = lineY + (lineH - icon.height) / 2
        x += icon.width + gap
      }
    }

    const alignedRowX = (span: number): number => {
      if (span <= 0) return contentX
      if (align === 'right') return contentXEnd - span
      if (align === 'center') return contentX + (contentWidth - span) / 2
      return contentX
    }

    const placeBeforeAndAfterInOneRow = (lineY: number, lineH: number) => {
      const beforeSpan = iconsSpanWidth(this.beforeIcons, gap)
      const afterSpan = iconsSpanWidth(this.afterIcons, gap)
      const total =
        beforeSpan +
        afterSpan +
        (this.beforeIcons.length && this.afterIcons.length ? gap : 0)
      let x = alignedRowX(total)
      placeIconRow(this.beforeIcons, x, lineY, lineH)
      if (this.beforeIcons.length) x += beforeSpan + gap
      placeIconRow(this.afterIcons, x, lineY, lineH)
    }

    const hasVisibleText = lines.some((line) => line.text.length > 0)
    if (lines.length === 0 || !hasVisibleText) {
      const lineY = lines[0]?.y ?? contentY
      const lineH = lines[0]?.height ?? contentHeight
      placeBeforeAndAfterInOneRow(lineY, lineH)
      return
    }

    const first = lines[0]
    const last = lines[lines.length - 1]
    const beforeSpan = iconsSpanWidth(this.beforeIcons, gap)
    const afterSpan = iconsSpanWidth(this.afterIcons, gap)

    if (this.beforeIcons.length > 0) {
      placeIconRow(
        this.beforeIcons,
        first.x - gap - beforeSpan,
        first.y,
        first.height
      )
    }

    if (this.afterIcons.length === 0) return

    if (afterOnNextLine) {
      placeIconRow(
        this.afterIcons,
        alignedRowX(afterSpan),
        last.y + last.height,
        last.height
      )
      return
    }

    placeIconRow(
      this.afterIcons,
      last.x + last.width + gap,
      last.y,
      last.height
    )
  }

  private paintIcons(): void {
    for (const icon of this.beforeIcons) icon.draw()
    for (const icon of this.afterIcons) icon.draw()
  }

  private paintLines(
    ctx: CanvasRenderingContext2D,
    lines: LayoutLine[],
    _textAnchor: number
  ): void {
    const { options } = this
    // 按行左边缘绘制，适配首行缩进 / 末行让位
    ctx.textBaseline = 'top'
    ctx.textAlign = 'left'
    if (options.color) ctx.fillStyle = options.color

    for (const line of lines) {
      if (line.text) ctx.fillText(line.text, line.x, line.y)
    }
  }

  private drawDebug(textAnchor: number, debugY: number): void {
    const { pad, box, paint } = this
    const {
      x,
      y,
      width,
      height,
      contentX,
      contentY,
      contentWidth,
      contentHeight,
      contentXEnd,
      contentYEnd,
    } = box
    const debugColor = '#0C8CE9'

    paint.drawRect(x, y, width, height, {
      borderWidth: 1,
      borderColor: debugColor,
    })

    if (pad.top || pad.right || pad.bottom || pad.left) {
      paint.drawRect(contentX, contentY, contentWidth, contentHeight, {
        borderWidth: 1,
        borderColor: '#94a3b8',
        lineDash: [4, 3],
      })
    }

    paint.drawLine([textAnchor, contentY, textAnchor, contentYEnd], {
      borderWidth: 1,
      borderColor: debugColor,
    })
    paint.drawLine([contentX, debugY, contentXEnd, debugY], {
      borderWidth: 1,
      borderColor: debugColor,
    })
  }
}
