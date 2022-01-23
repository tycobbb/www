import { single } from "../../Core/Scope.ts"
import { EventStream, EventBus } from "../../Core/mod.ts"
import { Event } from "./Event.ts"

// -- module --
// an stream of application events
export type Events =
  EventStream<Event>

// a module that provides an app event stream
export type EventsModule = {
  get: () => Events
}

// -- impls --
export const Events: EventsModule = {
  get: single(() => new EventBus<Event>())
}