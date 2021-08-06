import { detect } from "https://deno.land/std@0.100.0/fs/mod.ts"
import { log, run, Path } from "../../Core/mod.ts"

export class ParseIgnores {
  // -- props --
  #path: Path

  // -- lifetime --
  constructor(path: Path) {
    this.#path = path
  }

  // -- command --
  async call(): Promise<Set<string>> {
    // decode raw paths
    const raw = await this.#decode()

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

  async #decode(): Promise<string[]> {
    const raw = []

    // decode .gitignore paths
    const gitignore = this.#path.join(".gitignore")
    for (const line of await this.#readLines(gitignore)) {
      raw.push(line)
    }

    // run git status to get files ignored by nested gitignores
    const status = await run("git", "status", "--ignored", "--porcelain=1")
    for (const line of this.#intoLines(status)) {
      if (line.startsWith("!!")) {
        raw.push(line.slice(3))
      }
    }

    // decode tool-specific ignores
    const wwwignore = this.#path.join(".wwwignore")
    for (const line of await this.#readLines(wwwignore)) {
      raw.push(line)
    }

    return raw
  }

  async #readLines(path: Path): Promise<string[]> {
    if (!await path.exists()) {
      return Promise.resolve([])
    }

    return this.#intoLines(await path.read())
  }

  #intoLines(content: string): string[] {
    const eol = detect(content)
    if (eol == null) {
      log.debug(`- could not detect newline for ${content}`)
      return []
    }

    return content.split(eol)
  }
}
