import { Paint } from "./Paint"

export interface ShapeConfig {
    x: number
    y: number
    width: number
    height: number
    visible?: boolean
}

export abstract class Shape {
    paint: Paint = null!
    x: number = 0;
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
    }
    abstract render(paint: Paint): void
    inside(x: number, y: number): boolean {
        if (!this.visible) return false
        return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height
    }
    draw() {
        if (!this.visible) return
        this.render(this.paint);
    }
}