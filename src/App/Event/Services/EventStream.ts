import { Event } from "../Event.ts"
import { Events, EventListener } from "./Events.ts"

// a concrete stream of application events
export class EventStream implements Events {
  // -- module --
  static get = () => new EventStream()

  // -- props --
  #listeners: EventListener[] = []

  // -- commands --
  add(evt: Event) {
    for (const listener of this.#listeners) {
      listener(evt)
    }
  }

  // add a listener to this event stream
  on(listener: EventListener) {
    this.#listeners.push(listener)
  }
}
