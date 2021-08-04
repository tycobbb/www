import { Args, parse } from "https://deno.land/std@0.100.0/flags/mod.ts"
import { exists } from "https://deno.land/std@0.100.0/fs/mod.ts"
import { Config, Paths } from "../Domain/mod.ts"

export class Parse {
  // -- props --
  private args: string[]

  // -- lifetime --
  constructor(args: string[]) {
    this.args = args
  }

  // -- command --
  async call(): Promise<Config> {
    // parse args
    const args = parse(this.args)

    // decode paths
    const paths = await this.decodePaths(args)

    // build config
    return new Config(paths)
  }

  // -- c/helpers
  async decodePaths(args: Args): Promise<Paths> {
    const root = args._[0]
    if (root == null) {
      return new Paths(".")
    }

    if (typeof root !== "string") {
      throw new Error("path must be a string")
    }

    if (!await exists(root)) {
      throw new Error("path must exist")
    }

    return new Paths(root)
  }
}
