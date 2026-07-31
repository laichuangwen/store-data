import { Paint } from './Paint'
import { Icon } from './Icon'
import { IconWithShadow } from './IconWithShadow'
import { Text, type TextAlign, type VerticalAlign } from './Text'

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const paint = new Paint(canvas)
const ctx = paint.getCtx()

const ICON_SIZE = 36
const INLINE_ICON_SIZE = 18

const svgIcon = new window.Image()
svgIcon.src =
  'data:image/svg+xml,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36" fill="none">
  <rect x="4" y="4" width="28" height="28" rx="8" fill="#0C8CE9"/>
  <path d="M12 13h12M12 18h12M12 23h8" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>
</svg>`.trim())
svgIcon.onload = () => render()

const starIcon = new window.Image()
starIcon.src =
  'data:image/svg+xml,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
  <path d="M9 2.2l1.76 3.56 3.93.57-2.84 2.77.67 3.91L9 11.18l-3.52 1.85.67-3.91L3.3 6.33l3.93-.57L9 2.2z" fill="#F59E0B"/>
</svg>`.trim())
starIcon.onload = () => render()

const checkIcon = new window.Image()
checkIcon.src =
  'data:image/svg+xml,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
  <circle cx="9" cy="9" r="8" fill="#10B981"/>
  <path d="M5.5 9.2l2.2 2.2 4.8-4.8" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`.trim())
checkIcon.onload = () => render()

const textEl = document.getElementById('text') as HTMLTextAreaElement
const fontSizeEl = document.getElementById('fontSize') as HTMLInputElement
const fontSizeVal = document.getElementById('fontSizeVal')!
const lineHeightEl = document.getElementById('lineHeight') as HTMLInputElement
const lineHeightVal = document.getElementById('lineHeightVal')!
const boxWidthEl = document.getElementById('boxWidth') as HTMLInputElement
const boxWidthVal = document.getElementById('boxWidthVal')!
const boxHeightEl = document.getElementById('boxHeight') as HTMLInputElement
const boxHeightVal = document.getElementById('boxHeightVal')!
const padTopEl = document.getElementById('padTop') as HTMLInputElement
const padTopVal = document.getElementById('padTopVal')!
const padRightEl = document.getElementById('padRight') as HTMLInputElement
const padRightVal = document.getElementById('padRightVal')!
const padBottomEl = document.getElementById('padBottom') as HTMLInputElement
const padBottomVal = document.getElementById('padBottomVal')!
const padLeftEl = document.getElementById('padLeft') as HTMLInputElement
const padLeftVal = document.getElementById('padLeftVal')!
const maxLineClampEl = document.getElementById('maxLineClamp') as HTMLSelectElement
const fontEl = document.getElementById('font') as HTMLSelectElement
const colorEl = document.getElementById('color') as HTMLInputElement
const debugEl = document.getElementById('debug') as HTMLInputElement
const autoRowHeightEl = document.getElementById('autoRowHeight') as HTMLInputElement
const showBeforeIconsEl = document.getElementById('showBeforeIcons') as HTMLInputElement
const showAfterIconsEl = document.getElementById('showAfterIcons') as HTMLInputElement
const heightInfoEl = document.getElementById('heightInfo')!

let align: TextAlign = 'center'
let verticalAlign: VerticalAlign = 'middle'
let reportedHeight: number | null = null

/** 划选锚点 / 焦点（扁平文本下标） */
let selAnchor = 0
let selFocus = 0
let selecting = false
let textView: Text | null = null

/** 可悬停的图标列表（每次 render 重建） */
let hoverIcons: Icon[] = []
let hoveredIconName: string | null = null

function onIconHover(icon: Icon | null) {
  const name = icon?.name ?? null
  if (hoveredIconName === name) return
  hoveredIconName = name
  canvas.style.cursor = name ? 'pointer' : ''
  if (name) {
    console.log('[icon hover]', name, icon)
  }
  // 刷新底部状态栏以展示当前悬停图标
  if (heightInfoEl.textContent) {
    const base = heightInfoEl.textContent.replace(/ · 悬停 .+/, '')
    heightInfoEl.textContent = name ? `${base} · 悬停 ${name}` : base
  }
}
function syncLabels() {
  fontSizeVal.textContent = fontSizeEl.value
  lineHeightVal.textContent =
    lineHeightEl.value === '0' ? '自动' : lineHeightEl.value
  boxWidthVal.textContent = boxWidthEl.value
  boxHeightVal.textContent = boxHeightEl.value
  padTopVal.textContent = padTopEl.value
  padRightVal.textContent = padRightEl.value
  padBottomVal.textContent = padBottomEl.value
  padLeftVal.textContent = padLeftEl.value
}

function setActive(group: string, value: string) {
  document.querySelectorAll(`[data-group="${group}"]`).forEach((btn) => {
    btn.classList.toggle('active', (btn as HTMLElement).dataset.value === value)
  })
}

document.querySelectorAll('[data-group="align"]').forEach((btn) => {
  btn.addEventListener('click', () => {
    align = (btn as HTMLElement).dataset.value as TextAlign
    setActive('align', align)
    clearSelection()
    render()
  })
})

document.querySelectorAll('[data-group="verticalAlign"]').forEach((btn) => {
  btn.addEventListener('click', () => {
    verticalAlign = (btn as HTMLElement).dataset.value as VerticalAlign
    setActive('verticalAlign', verticalAlign)
    clearSelection()
    render()
  })
})

function resolveMaxLineClamp(): number | undefined {
  const value = maxLineClampEl.value
  if (value === 'height') return undefined
  return Number(value)
}

function clearSelection() {
  selAnchor = 0
  selFocus = 0
}

function canvasPoint(e: PointerEvent | MouseEvent) {
  const rect = canvas.getBoundingClientRect()
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  }
}

function selectionRange() {
  const start = Math.min(selAnchor, selFocus)
  const end = Math.max(selAnchor, selFocus)
  return start === end ? undefined : { start, end }
}

function render() {
  syncLabels()
  reportedHeight = null

  const dpr = window.devicePixelRatio || 1
  const cssW = canvas.clientWidth
  const cssH = canvas.clientHeight
  canvas.width = Math.floor(cssW * dpr)
  canvas.height = Math.floor(cssH * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  ctx.clearRect(0, 0, cssW, cssH)
  ctx.fillStyle = '#f7f8fa'
  ctx.fillRect(0, 0, cssW, cssH)

  const boxW = Number(boxWidthEl.value)
  const boxH = Number(boxHeightEl.value)
  const x = (cssW - boxW) / 2
  const y = (cssH - boxH) / 2

  ctx.fillStyle = '#fff'
  ctx.fillRect(x, y, boxW, boxH)
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1
  ctx.strokeRect(x, y, boxW, boxH)

  if (svgIcon.complete && svgIcon.naturalWidth > 0) {
    const iconY = Math.max(8, y - ICON_SIZE - 10)

    // 普通图标
    const icon = new Icon(paint, {
      source: svgIcon,
      name: 'text-icon',
      x,
      y: iconY,
      width: ICON_SIZE,
      height: ICON_SIZE,
    })
    icon.draw()

    // 带阴影边框的图标
    const iconShadow = new IconWithShadow(paint, {
      source: svgIcon,
      name: 'text-icon-shadow',
      x: x + ICON_SIZE + 12,
      y: iconY,
      width: ICON_SIZE,
      height: ICON_SIZE,
      borderColor: '#d0d5dd',
      fillColor: '#ffffff',
      padding: 4,
      borderWidth: 1,
      radius: 12,
    })
    iconShadow.draw()

    hoverIcons = [icon, iconShadow]
  } else {
    hoverIcons = []
  }

  const fontSize = Number(fontSizeEl.value)
  const lineHeight = Number(lineHeightEl.value)
  const maxLineClamp = resolveMaxLineClamp()
  const autoRowHeight = autoRowHeightEl.checked

  const padding = {
    top: Number(padTopEl.value),
    right: Number(padRightEl.value),
    bottom: Number(padBottomEl.value),
    left: Number(padLeftEl.value),
  }

  const selection = selectionRange()

  const beforeIcons: Icon[] = []
  const afterIcons: Icon[] = []

  if (
    showBeforeIconsEl.checked &&
    svgIcon.complete &&
    svgIcon.naturalWidth > 0
  ) {
    beforeIcons.push(
      new Icon(paint, {
        source: svgIcon,
        name: 'before-list',
        x: 0,
        y: 0,
        width: INLINE_ICON_SIZE,
        height: INLINE_ICON_SIZE,
      })
    )
  }

  if (
    showBeforeIconsEl.checked &&
    starIcon.complete &&
    starIcon.naturalWidth > 0
  ) {
    beforeIcons.push(
      new Icon(paint, {
        source: starIcon,
        name: 'before-star',
        x: 0,
        y: 0,
        width: INLINE_ICON_SIZE,
        height: INLINE_ICON_SIZE,
      })
    )
  }

  if (
    showAfterIconsEl.checked &&
    checkIcon.complete &&
    checkIcon.naturalWidth > 0
  ) {
    afterIcons.push(
      new Icon(paint, {
        source: checkIcon,
        name: 'after-check',
        x: 0,
        y: 0,
        width: INLINE_ICON_SIZE,
        height: INLINE_ICON_SIZE,
      })
    )
  }

  if (
    showAfterIconsEl.checked &&
    svgIcon.complete &&
    svgIcon.naturalWidth > 0
  ) {
    afterIcons.push(
      new IconWithShadow(paint, {
        source: svgIcon,
        name: 'after-shadow',
        x: 0,
        y: 0,
        width: INLINE_ICON_SIZE + 4,
        height: INLINE_ICON_SIZE + 4,
        borderColor: '#d0d5dd',
        fillColor: '#ffffff',
        padding: 2,
        borderWidth: 1,
        radius: 6,
      })
    )
  }

  textView = new Text(paint, {
    text: textEl.value,
    x,
    y,
    width: boxW,
    height: boxH,
    fontSize,
    font: fontEl.value,
    color: colorEl.value,
    align,
    verticalAlign,
    padding,
    autoRowHeight,
    onHeight: (h) => {
      reportedHeight = h
    },
    debug: debugEl.checked,
    selection,
    beforeIcons,
    afterIcons,
    iconGap: 6,
    ...(lineHeight > 0 ? { lineHeight } : {}),
    ...(maxLineClamp != null ? { maxLineClamp } : {}),
  })

  const { height, neededHeight, lines, clamped } = textView.draw()

  // 文本框内外图标均可悬停
  hoverIcons = [...hoverIcons, ...textView.getIcons()]

  const parts = [
    `绘制 ${height.toFixed(1)} px`,
    `完整 ${neededHeight.toFixed(1)} px`,
    `${lines} 行`,
    `pad ${padding.top}/${padding.right}/${padding.bottom}/${padding.left}`,
  ]
  if (beforeIcons.length) parts.push(`前 ${beforeIcons.length} 图标`)
  if (afterIcons.length) parts.push(`后 ${afterIcons.length} 图标`)
  if (clamped) parts.push('已截断')
  if (maxLineClamp != null) parts.push(`限 ${maxLineClamp} 行`)
  else parts.push('按高度')
  if (reportedHeight != null) parts.push(`回传 ${reportedHeight} px`)
  if (selection) {
    parts.push(`已选 ${selection.end - selection.start} 字`)
  }
  if (hoveredIconName) {
    parts.push(`悬停 ${hoveredIconName}`)
  }
  heightInfoEl.textContent = parts.join(' · ')
}

async function copySelection() {
  if (!textView) return
  const selected = textView.getSelectedText()
  if (!selected) return
  try {
    await navigator.clipboard.writeText(selected)
  } catch {
    // 降级：部分环境无 clipboard 权限
    const ta = document.createElement('textarea')
    ta.value = selected
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
}

canvas.addEventListener('pointerdown', (e) => {
  if (!textView || e.button !== 0) return
  const { x, y } = canvasPoint(e)
  // 点在图标上时不启动划选
  if (hoverIcons.some((icon) => icon.inside(x, y))) return
  canvas.setPointerCapture(e.pointerId)
  selAnchor = selFocus = textView.hitTest(x, y)
  selecting = true
  render()
})

canvas.addEventListener('pointermove', (e) => {
  const { x, y } = canvasPoint(e)

  if (selecting && textView) {
    const next = textView.hitTest(x, y)
    if (next !== selFocus) {
      selFocus = next
      render()
    }
    return
  }

  // 鼠标移入图标区域时触发回调
  const hit = hoverIcons.find((icon) => icon.inside(x, y)) ?? null
  onIconHover(hit)
})

canvas.addEventListener('pointerleave', () => {
  onIconHover(null)
})
canvas.addEventListener('pointerup', () => {
  selecting = false
})

canvas.addEventListener('pointercancel', () => {
  selecting = false
})

window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
    // 焦点在 textarea 时交给浏览器原生复制
    if (document.activeElement === textEl) return
    const selected = textView?.getSelectedText()
    if (!selected) return
    e.preventDefault()
    void copySelection()
  }
})

const inputs = [
  textEl,
  fontSizeEl,
  lineHeightEl,
  boxWidthEl,
  boxHeightEl,
  padTopEl,
  padRightEl,
  padBottomEl,
  padLeftEl,
  maxLineClampEl,
  fontEl,
  colorEl,
  debugEl,
  autoRowHeightEl,
  showBeforeIconsEl,
  showAfterIconsEl,
]

for (const el of inputs) {
  el.addEventListener('input', () => {
    clearSelection()
    render()
  })
  el.addEventListener('change', () => {
    clearSelection()
    render()
  })
}

window.addEventListener('resize', render)

setActive('align', align)
setActive('verticalAlign', verticalAlign)
render()
