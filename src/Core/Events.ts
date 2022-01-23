// -- types --
// an event listener (action, callback, handler, &c)
export type EventListener<E> =
  (evt: E) => void | Promise<void>

// a interface for an event bus
export interface EventStream<E> {
  // add an event listener
  on(listener: EventListener<E>): void

  // send a new event
  send(evt: E): Promise<void>
}

// -- impls --
// a concrete stream of events
export class EventBus<E> implements EventStream<E> {
  // -- props --
  // the list of event listeners
  #listeners: EventListener<E>[] = []

  // a no-op promise
  #noop = Promise.resolve()

  // -- commands --
  on(listener: EventListener<E>): void {
    this.#listeners.push(listener)
  }

  async send(evt: E): Promise<void> {
    const m = this

    // call every action, collecting any promises
    const actions = m.#listeners.map((fn) => {
      return fn(evt) || m.#noop
    })

    // wait for the promises
    await Promise.all(actions)
  }
}
