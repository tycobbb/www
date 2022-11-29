import { Path, EventListener, EventBus } from '../Core/mod.ts'
import { Config } from '../App/Config/Config.ts'
import { Env } from '../App/Config/Env.ts'
import { Paths } from '../App/Config/Paths.ts'
import { Event } from '../App/Event/mod.ts'

// -- stubs --
export function stubConfig() {
  const root = Path.base("./test/fixtures")

  return new Config(
    Env.Dev,
    420,
    new Paths(
      root,
      root.join("dist")
    ),
    new Set()
  )
}

export function stubEvents<E = Event>({ isLive } = { isLive: false }) {
  return new MockEvents<E>(isLive)
}

// -- mocks --
class MockEvents<E> extends EventBus<E> {
  // -- props --
  // the list of events
  all: E[] = []

  // if this runs live events
  isLive: boolean

  // -- lifetime --
  constructor(isLive: boolean) {
    super()

    // set props
    this.isLive = isLive
  }

  // -- EventBus --
  async send(evt: E): Promise<void> {
    const m = this

    m.all.push(evt)

    if (m.isLive) {
      await super.send(evt)
    } else {
      return Promise.resolve()
    }
  }

  on(listener: EventListener<E>): void {
    if (this.isLive) {
      super.on(listener)
    }
  }

  reset() {
    const m = this

    m.all = []
    if (m.isLive) {
      super.reset()
    }
  }

}


