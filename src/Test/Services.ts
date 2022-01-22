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

export function stubEvents() {
  return new MockEvents()
}

// -- mocks --
class MockEvents implements Events {
  // -- props --
  all: Event[] = []

  // -- Events --
  add(evt: Event): Promise<void> {
    this.all.push(evt)
    return Promise.resolve()
  }

  on(_: EventListener): void {
  }
}
