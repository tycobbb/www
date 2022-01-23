import { Path, EventStream, EventListener } from '../Core/mod.ts'
import { Config } from '../App/Config/Config.ts'
import { Env } from '../App/Config/Env.ts'
import { Paths } from '../App/Config/Paths.ts'
import { Event } from '../App/Event/mod.ts'

// -- stubs --
export function stubConfig() {
  return new Config(
    Env.Dev,
    new Paths(Path.base("./test/fixtures")),
    new Set()
  )
}

export function stubEvents<E = Event>() {
  return new MockEvents<E>()
}

// -- mocks --
class MockEvents<E> implements EventStream<E> {
  // -- props --
  all: E[] = []

  // -- commands --
  reset() {
    this.all = []
  }

  // -- Events --
  send(evt: E): Promise<void> {
    this.all.push(evt)
    return Promise.resolve()
  }

  on(_: EventListener<E>): void {
  }
}
