type ListenerEntry = {
    target: EventTarget;
    name: string;
    fn: EventListenerOrEventListenerObject;
    options?: AddEventListenerOptions | boolean;
};

export default class EventBrowser {
    private stageElement: HTMLElement;
    private eventTasks: Set<ListenerEntry> = new Set();
    constructor(stageElement: HTMLElement) {
        this.stageElement = stageElement;
        this.init();
    }

    init() {
        this.bind(window, 'resize', this.handleResize.bind(this));
        this.bind(window, 'mouseup', this.handleMouseUp.bind(this));
        this.bind(window, 'mousemove', this.handleMousemove.bind(this));
        this.bind(window, 'blur', this.handleOutsideMousedown.bind(this));
        this.bind(window, 'mousedown', this.handleOutsideMousedown.bind(this));
        this.bind(window, 'keydown', this.handleKeydown.bind(this));
        this.bind(this.stageElement, 'click', this.handleClick.bind(this));
        this.bind(this.stageElement, 'wheel', this.handleWheel.bind(this), { passive: false });
        this.bind(this.stageElement, 'touchstart', this.handleTouchstart.bind(this), { passive: false });
        this.bind(this.stageElement, 'touchend', this.handleTouchend.bind(this));
        this.bind(this.stageElement, 'touchmove', this.handleTouchmove.bind(this), { passive: false });
        this.bind(this.stageElement, 'contextmenu', this.handleContextMenu.bind(this));
        this.bind(this.stageElement, 'mousedown', this.handleMouseDown.bind(this));
        this.bind(this.stageElement, 'dblclick', this.handleDblclick.bind(this));
        this.bind(this.stageElement, 'mouseover', this.handleMouseover.bind(this));
        this.bind(this.stageElement, 'mouseout', this.handleMouseout.bind(this));
    }
    destroy() {
        const entries = Array.from(this.eventTasks);
        entries.forEach(({ target, name, fn, options }) => {
            this.unbind(target, name, fn, options);
        });
        this.eventTasks.clear();
    }

    private bind(
        target: EventTarget,
        name: string,
        fn: EventListenerOrEventListenerObject,
        options?: AddEventListenerOptions | boolean,
    ): void {
        target.addEventListener(name, fn, options);
        this.eventTasks.add({ target, name, fn, options });
    }

    private unbind(target: EventTarget, name: string, fn: EventListenerOrEventListenerObject, options?: AddEventListenerOptions | boolean): void {
        target.removeEventListener(name, fn as EventListener, options as any);
        for (const entry of this.eventTasks) {
            if (entry.target === target && entry.name === name && entry.fn === fn) {
                this.eventTasks.delete(entry);
                break;
            }
        }
    }
}
