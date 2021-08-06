import { Path } from "../Core/mod.ts"
import { Paths } from "./Paths.ts"

// -- types --
export enum Environment {
  Dev = 0,
  Prod = 1
}

// -- impls --
export class Config {
  // -- props --
  // the execution environment
  readonly env: Environment
  // a collection of config paths
  readonly paths: Paths
  // the set of ignored paths
  readonly ignored: Set<string>

  // -- lifecycle --
  constructor(env: Environment, paths: Paths, ignored: Set<string>) {
    this.env = env
    this.paths = paths
    this.ignored = ignored
  }

  // -- queries --
  get isProd() {
    return this.env === Environment.Prod
  }

  isIgnored(path: Path): boolean {
    return this.ignored.has(path.relative)
  }
}
