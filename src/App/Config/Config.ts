import { Path } from "../../Core/mod.ts"
import { Env } from "./Env.ts"
import { Paths } from "./Paths.ts"
import { DecodeConfig } from "./Services/mod.ts"

// -- impls --
export class Config {
  // -- module --
  static get = () => this.#shared

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

  // -- shared --
  // a mutable shared instance; generally don't want to do things like this but
  // the config is special
  static #shared: Config

  // set the shared config
  static async set(args: string[]) {
    this.#shared = await new DecodeConfig(args).call()
  }
}
