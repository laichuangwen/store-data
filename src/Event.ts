export type EventMap = Record<string, unknown>;

export class EventBus<T extends EventMap = EventMap> extends EventTarget {
    on<K extends keyof T & string>(
        type: K,
        listener: (event: any) => void,
        options?: boolean | AddEventListenerOptions,
    ) {
        this.addEventListener(type, listener as EventListener, options);
    }

    off<K extends keyof T & string>(
        type: K,
        listener: (event: any) => void,
        options?: boolean | EventListenerOptions,
    ) {
        this.removeEventListener(type, listener as EventListener, options);
    }

    once<K extends keyof T & string>(
        type: K,
        listener: (event: any) => void,
    ) {
        this.on(type, listener, { once: true });
    }

    emit<K extends keyof T & string>(
        type: K,
        detail?: T[K],
        options?: Omit<CustomEventInit, 'detail'>,
    ): boolean {
        return this.dispatchEvent(
            detail instanceof Event ? detail : new CustomEvent(type, { detail, ...options })
        );
    }
}
export interface CellClickEvent {
    event: MouseEvent;
    cell: any;
}
const eventBus = new EventBus<{
    click: MouseEvent;
    keydown: KeyboardEvent;
    scroll: WheelEvent;
    cellClick: CellClickEvent
}>();
eventBus.on('cellClick',(event: CellClickEvent)=>{
    console.log('cellClick', e, cell);
})
window.addEventListener('click', (event: MouseEvent) => {
    eventBus.emit('click', event);
});
window.addEventListener('keydown', (event: KeyboardEvent) => {
    eventBus.emit('keydown', event);
});



eventBus.on('keydown', (event: KeyboardEvent) => {
    console.log(event);
});
eventBus.on('cellClick', ({
    event,
    cell
}) => {
    console.log('cellClick', event, cell);
});
eventBus.on('click', (event: MouseEvent) => {
    console.log(event);
    eventBus.emit('cellClick', {
        event,
        cell: {
            x: event.clientX,
            y: event.clientY,
        }
    });
});
export default eventBus;