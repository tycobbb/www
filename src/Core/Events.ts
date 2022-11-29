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
  // -- constants --
  // a no-op promise
  static noop = Promise.resolve()

  // -- props --
  // the list of event listeners
  #listeners: EventListener<E>[] = []

  // -- commands --
  // add a listener
  on(listener: EventListener<E>): void {
    this.#listeners.push(listener)
  }

  // send an event to all listeners
  async send(evt: E): Promise<void> {
    const m = this

    // call every action, collecting any promises
    const actions = m.#listeners.map((fn) => {
      return fn(evt) || EventBus.noop
    })

    // wait for the promises
    await Promise.all(actions)
  }

  // reset the bus
  reset() {
    const m = this
    m.#listeners = []
  }

}
