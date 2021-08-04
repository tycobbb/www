import { log } from "../Core/mod.ts"
import { Paths, Entry, File, Dir } from "../Domain/mod.ts"
import { Action } from "./Action.ts"

export class Build implements Action {
  // -- props --
  #paths: Paths

  // -- lifetime --
  constructor(paths: Paths) {
    this.#paths = paths
  }

  // -- commands --
  async call() {
    const { src, dst } = this.#paths

    // build dist dir
    await Deno.mkdir(dst.str, { recursive: true })

    // construct entry point
    const root: Dir = { kind: "dir", path: src }

    // traverse proj dir
    for await (const files of this.#walk([root])) {
      for (const file of files) {
        log.debug(`- ${file.path.str}`)
      }
    }
  }

  // -- queries --
  async *#walk(level: Dir[]): AsyncIterable<Entry[]> {
    // partition children into dirs and files
    const nodes: Dir[] = []
    const files: File[] = []

    // for each dir in the level
    for (const dir of level) {
      // for each dir child
      for await (const child of dir.path.children()) {
        // if not ignored
        const path = dir.path.join(child.name)
        if (this.#paths.isIgnored(path)) {
          continue
        }

        // add to partition
        if (child.isDirectory) {
          nodes.push({ kind: "dir", path })
        } else {
          files.push({ kind: "file", path })
        }
      }
    }

    // yield files as a group
    if (files.length !== 0) {
      yield files
    }

    // recurse into directories
    if (nodes.length !== 0) {
      yield nodes
      yield *this.#walk(nodes)
    }
  }
}
