import { Args, parse } from "https://deno.land/std@0.100.0/flags/mod.ts"
import { Path } from "../../Core/mod.ts"
import { Config, Environment, Paths } from "../../Domain/mod.ts"
import { ParseIgnores } from "./ParseIgnores.ts"

export class Parse {
  // -- props --
  #args: string[]

  // -- lifetime --
  constructor(args: string[]) {
    this.#args = args
  }

  // -- command --
  async call(): Promise<Config> {
    // parse args
    const args = parse(this.#args)

    // parse components
    const env = this.#decodeEnv(args)
    const paths = await this.#decodePaths(args)
    const ignores = await this.#decodeIgnores(paths)

    // build config
    return new Config(env, paths, ignores)
  }

  // -- c/helpers
  #decodeEnv(args: Args): Environment {
    if (args.prod || Deno.env.get("PROD") != null) {
      return Environment.Prod
    }

    return Environment.Dev
  }

  async #decodePaths(args: Args): Promise<Paths> {
    // parse root path from cmd line args
    const path = args._[0]
    if (path == null) {
      throw new Error("must provide a path")
    }

    if (typeof path !== "string") {
      throw new Error("path must be a string")
    }

    const root = Path.base(path)
    if (!await root.exists()) {
      throw new Error("path must exist")
    }

    // produce paths
    return new Paths(root)
  }

  async #decodeIgnores(paths: Paths): Promise<Set<string>> {
    const parse = new ParseIgnores(paths.src)
    return await parse.call()
  }
}
