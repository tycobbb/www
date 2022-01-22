import { lazy } from "../../../Core/mod.ts"
import { Event } from "../Event.ts"

// -- module --
type EventsModule = {
  get(): Events
}

// -- types --
// an event listener (action, callback, handler, &c)
export type EventListener =
  (evt: Event) => void | Promise<void>

// a interface for a stream of application events
export interface Events {
  // add a new event to the stream
  add(evt: Event): Promise<void>

  // add an event listener to the stream
  on(listener: EventListener): void
}

// -- impls --
// a module to get an events instance
export const Events: EventsModule = {
  get: lazy(() => new EventStream())
}

// a concrete stream of application events
class EventStream implements Events {
  // -- props --
  // the list of event listeners
  #listeners: EventListener[] = []

  // a no-op promise
  #noop = Promise.resolve()

  // -- commands --
  async add(evt: Event): Promise<void> {
    const m = this

    // call every action, collecting any promises
    const actions = m.#listeners.map((fn) => {
      return fn(evt) || m.#noop
    })

    // wait for the promises
    await Promise.all(actions)
  }

  on(listener: EventListener): void {
    this.#listeners.push(listener)
  }
}
