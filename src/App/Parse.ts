import { Args, parse } from "https://deno.land/std@0.100.0/flags/mod.ts"
import { Config, Path, Paths } from "../Domain/mod.ts"

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
    const path = args._[0]
    if (path == null) {
      throw new Error("must provide a path")
    }

    if (typeof path !== "string") {
      throw new Error("path must be a string")
    }

    const root = new Path(path)
    if (!await root.exists()) {
      throw new Error("path must exist")
    }

    return new Paths(root)
  }
}
