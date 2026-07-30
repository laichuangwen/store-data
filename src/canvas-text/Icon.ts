import { Paint } from "./Paint";
import { Shape, ShapeConfig } from "./Shape"
export interface IconConfig extends ShapeConfig {
    source: HTMLImageElement;
    name: string;
}
export class Icon extends Shape {
    source: HTMLImageElement;
    name: string;
    constructor(paint: Paint, config: IconConfig) {
        super(paint, config)
        this.source = config.source
        this.name = config.name
    }
    render(paint: Paint): void {
        paint.drawImage(this.source, this.x, this.y, this.width, this.height)
    }
}
