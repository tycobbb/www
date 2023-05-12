import { Args } from "https://deno.land/std@0.122.0/flags/mod.ts"
import { Path, transient } from "../../Core/mod.ts"
import { Env } from "./Env.ts"
import { Paths } from "./Paths.ts"
import { DecodeConfig } from "./Services/mod.ts"

// -- impls --
export class Config {
  // -- module --
  static readonly get = transient(() => this.shared)

  // -- props --
  // the execution environment
  readonly env: Env

  // the port
  readonly port: number

  // a collection of config paths
  readonly paths: Paths

  // the set of ignored paths
  readonly ignored: Set<string>

  // -- lifecycle --
  constructor(
    env: Env,
    port: number,
    paths: Paths,
    ignored: Set<string>
  ) {
    this.env = env
    this.port = port
    this.paths = paths
    this.ignored = ignored
  }

  // -- queries --
  get isProd() {
    return this.env === Env.Prod
  }

  isIgnored(path: Path): boolean {
    return this.ignored.has(path.rel)
  }

  // -- shared --
  // a mutable shared instance; generally don't want to do things like this but
  // the config is special
  static shared: Config

  // set the shared config
  static async set(args: Args) {
    this.shared = await new DecodeConfig(args).call()
  }
}
