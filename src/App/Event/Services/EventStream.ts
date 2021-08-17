import { lazy } from "../../../Core/mod.ts"
import { Event } from "../Event.ts"
import { Events, EventListener } from "./Events.ts"

// a concrete stream of application events
export class EventStream implements Events {
  // -- module --
  static get = lazy(() => new EventStream())

  // -- props --
  #listeners: EventListener[] = []

  // -- commands --
  async add(evt: Event): Promise<void> {
    await Promise.all(this.#listeners.map((action) => action(evt)))
  }

  // add a listener to this event stream
  on(listener: EventListener): void {
    this.#listeners.push(listener)
  }
}
