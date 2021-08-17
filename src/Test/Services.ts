import { Path } from '../Core/mod.ts'
import { Config } from '../App/Config/Config.ts'
import { Env } from '../App/Config/Env.ts'
import { Paths } from '../App/Config/Paths.ts'
import { Event, Events, EventListener } from '../App/Event/mod.ts'

// -- stubs --
export function stubConfig() {
  return new Config(
    Env.Dev,
    new Paths(Path.base("./test/fixtures")),
    new Set()
  )
}

// -- s/events
class MockEvents implements Events {
  add(_: Event): void {}
  on(_: EventListener): void {}
}

export function stubEvents() {
  return new MockEvents()
}
