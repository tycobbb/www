import { Path } from '../Core/mod.ts'
import { Config } from '../App/Config/Config.ts'
import { Env } from '../App/Config/Env.ts'
import { Paths } from '../App/Config/Paths.ts'

// -- constants --
export function stubConfig() {
  return new Config(
    Env.Dev,
    new Paths(Path.base("./test/fixtures")),
    new Set()
  )
}
