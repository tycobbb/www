import { Path } from '../src/Core/mod.ts'
import { Config } from '../src/App/Config/Config.ts'
import { Env } from '../src/App/Config/Env.ts'
import { Paths } from '../src/App/Config/Paths.ts'

// -- constants --
export function stubConfig() {
  return new Config(
    Env.Dev,
    new Paths(Path.base("./test/fixtures")),
    new Set()
  )
}
