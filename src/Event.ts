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