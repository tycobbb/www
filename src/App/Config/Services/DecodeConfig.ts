import { Args } from "https://deno.land/std@0.122.0/flags/mod.ts"
import { Path, lines, run } from "../../../Core/mod.ts"
import { Fatal } from "../../Error/mod.ts"
import { Config } from "../Config.ts"
import { Env } from "../Env.ts"
import { Paths } from "../Paths.ts"

export class DecodeConfig {
  // -- props --
  #args: Args

  // -- lifetime --
  constructor(args: Args) {
    this.#args = args
  }

  // -- command --
  async call(): Promise<Config> {
    // parse components
    const env = this.#decodeEnv()
    const paths = await this.#decodePaths()
    const ignores = await this.#decodeIgnores(paths)

    // build config
    return new Config(env, paths, ignores)
  }

  // -- c/helpers
  #decodeEnv(): Env {
    if (this.#args.prod || Deno.env.get("PROD") != null) {
      return Env.Prod
    } else {
      return Env.Dev
    }
  }

  async #decodePaths(): Promise<Paths> {
    // parse root path from cmd line args
    const path = this.#args._[0]
    if (path == null) {
      throw new Fatal("must provide a src path")
    }

    if (typeof path !== "string") {
      throw new Fatal("src path must be a string")
    }

    const root = Path.base(path)
    if (!await root.exists()) {
      throw new Fatal("src path must exist")
    }

    // produce paths
    return new Paths(root)
  }

  async #decodeIgnores(paths: Paths): Promise<Set<string>> {
    const src = paths.src

    // decode raw paths
    const raw = []

    // decode .gitignore paths
    const gitignore = src.join(".gitignore")
    for (const line of await this.#read(gitignore)) {
      raw.push(line)
    }

    // run git status to get files ignored by nested gitignores
    const status = await run("git", "status", "--ignored", "--porcelain=1")
    for (const line of lines(status)) {
      if (line.startsWith("!!")) {
        raw.push(line.slice(3))
      }
    }

    // decode tool-specific ignores
    const wwwignore = src.join(".wwwignore")
    for (const line of await this.#read(wwwignore)) {
      raw.push(line)
    }

    // clean raw paths and uniq them
    const uniq = new Set<string>()

    for (let path of raw) {
      if (path.endsWith("/")) {
        path = path.slice(0, -1)
      }

      if (path.length === 0) {
        continue
      }

      uniq.add(path)
    }

    return uniq
  }

  // -- helpers --
  async #read(path: Path): Promise<string[]> {
    if (await path.exists()) {
      return await path.read().then(lines)
    } else {
      return []
    }
  }
}
