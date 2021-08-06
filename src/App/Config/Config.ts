import { Path } from "../../Core/mod.ts"
import { Env } from "./Env.ts"
import { Paths } from "./Paths.ts"

// -- impls --
export class Config {
  // -- props --
  // the execution environment
  readonly env: Env

  // a collection of config paths
  readonly paths: Paths

  // the set of ignored paths
  readonly ignored: Set<string>

  // -- lifecycle --
  constructor(env: Env, paths: Paths, ignored: Set<string>) {
    this.env = env
    this.paths = paths
    this.ignored = ignored
  }

  // -- queries --
  get isProd() {
    return this.env === Env.Prod
  }

  isIgnored(path: Path): boolean {
    return this.ignored.has(path.relative)
  }
}
