type Listener = (event: MessageEvent) => void;

/** Stands in for EventSource, which jsdom lacks; tests push events with emit. */
class MockEventSource {
  static instances: MockEventSource[] = [];

  readonly url: string;
  closed = false;
  private listeners: Record<string, Listener[]> = {};

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  /** The most recently opened stream. */
  static latest() {
    return MockEventSource.instances[MockEventSource.instances.length - 1];
  }

  addEventListener(type: string, listener: Listener) {
    this.listeners[type] = [...(this.listeners[type] ?? []), listener];
  }

  removeEventListener(type: string, listener: Listener) {
    this.listeners[type] = (this.listeners[type] ?? []).filter((item) => item !== listener);
  }

  close() {
    this.closed = true;
  }

  /** Fires an event; data is sent as JSON like the backend does. */
  emit(type: string, data?: unknown) {
    const event = new MessageEvent(type, {
      data: data === undefined ? undefined : JSON.stringify(data),
    });
    (this.listeners[type] ?? []).forEach((listener) => listener(event));
  }
}

export default MockEventSource;
