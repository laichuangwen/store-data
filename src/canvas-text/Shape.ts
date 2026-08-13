import { Paint } from "./Paint"

/** 事件名 → 回调参数类型 */
export interface ShapeEventMap {
    click: MouseEvent
    dblclick: MouseEvent
    pointermove: PointerEvent
    pointerdown: PointerEvent
    pointerup: PointerEvent
    pointerleave: PointerEvent
    pointerenter: PointerEvent
    pointercancel: PointerEvent
}

export type ShapeEventName = keyof ShapeEventMap
export type ShapeEventCallback<K extends ShapeEventName = ShapeEventName> = (
    event: ShapeEventMap[K],
) => void

export interface ShapeConfig {
    x: number
    y: number
    width: number
    height: number
    visible?: boolean
}

export abstract class Shape {
    private hovered = false
    private listeners = new Map<ShapeEventName, Set<ShapeEventCallback>>()
    paint: Paint = null!
    x: number = 0
    y: number = 0
    width: number = 0
    height: number = 0
    visible: boolean = true

    constructor(paint: Paint, config: ShapeConfig) {
        this.paint = paint
        this.x = config.x
        this.y = config.y
        this.width = config.width
        this.height = config.height
        this.visible = config.visible ?? true
        this.paint.addShape(this)
    }

    abstract render(paint: Paint): void

    inside(x: number, y: number): boolean {
        if (!this.visible) return false
        return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height
    }

    insideByEvent(event: PointerEvent | MouseEvent): boolean {
        if (!this.visible) return false
        const { x, y } = this.paint.getRelativePosition(event)
        return this.inside(x, y)
    }

    on<K extends ShapeEventName>(eventName: K, callback: ShapeEventCallback<K>): void {
        let set = this.listeners.get(eventName)
        if (!set) {
            set = new Set()
            this.listeners.set(eventName, set)
        }
        set.add(callback as ShapeEventCallback)
    }

    dispatch<K extends ShapeEventName>(eventName: K, event: ShapeEventMap[K]): void {
        if (!this.visible) return
        // 不在区域内
        if (!this.insideByEvent(event)) {
            // 模拟 pointerleave
            if (eventName === 'pointermove' && this.hovered) {
                this.invoke('pointerleave', event as ShapeEventMap['pointerleave'])
                this.hovered = false
            }
            return
        }
        // 模拟 pointerenter
        if (eventName === 'pointermove' && !this.hovered) {
            this.invoke('pointerenter', event as ShapeEventMap['pointerenter'])
            this.hovered = true
        }
    this.invoke(eventName, event)
  }

  protected invoke<K extends ShapeEventName>(eventName: K, event: ShapeEventMap[K]): void {
    const callbacks = this.listeners.get(eventName)
    if (!callbacks?.size) return
    for (const callback of callbacks) {
      callback(event)
    }
  }

  draw() {
    if (!this.visible) return
    this.render(this.paint)
  }
}
