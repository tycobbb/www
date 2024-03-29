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
    const m = this

    // parse components
    const env = m.#decodeEnv()
    const port = m.#decodePort()
    const paths = await m.#decodePaths()
    const ignores = await m.#decodeIgnores(paths)

    // build config
    return new Config(env, port, paths, ignores)
  }

  // -- c/helpers
  #decodeEnv(): Env {
    const m = this
    if (m.#args.prod || Deno.env.get("PROD") != null) {
      return Env.Prod
    } else {
      return Env.Dev
    }
  }

  #decodePort(): number {
    return this.#args.port || 8888
  }

  async #decodePaths(): Promise<Paths> {
    const m = this

    // parse root path from cmd line args
    const path = m.#args._[0]
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

    // parse dist path from cmd line args
    const dist = Path.base(m.#args.out || "dist")

    // produce paths
    return new Paths(
      root,
      dist
    )
  }

  async #decodeIgnores(paths: Paths): Promise<Set<string>> {
    const src = paths.src

    // decode raw paths
    const raw = [
      ".git",
      ".gitignore",
      ".wwwignore",
      paths.dst.str,
    ]

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
