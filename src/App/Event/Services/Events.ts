import { Event } from "../Event.ts"

// -- types --
// an event listener (callback, action, handler)
export type EventListener = (evt: Event) => Promise<void>

// a interface for a stream of application events
export interface Events {
  // add a new event to the stream
  add(evt: Event): Promise<void>

  // add an event listener to the stream
  on(listener: EventListener): void
}
