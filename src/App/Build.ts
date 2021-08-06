import { Config, File, Dir } from "../Domain/mod.ts"
import { Action } from "./Action.ts"
import { Entry } from "./Entry.ts"
import { BuildOne } from "./BuildOne.ts"

export class Build implements Action {
  // -- deps --
  #cfg: Config
  #build: BuildOne

  // -- lifetime --
  constructor(cfg: Config) {
    this.#cfg = cfg
    this.#build = new BuildOne(cfg)
  }

  // -- commands --
  async call() {
    const { src, dst } = this.#cfg.paths

    // build dist dir
    await dst.mkdir()

    // construct entry point
    const root = new Dir(src)

    // traverse proj dir and build every file
    for await (const entries of this.#walk([root])) {
      for (const entry of entries) {
        this.#build.call(entry)
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
        if (this.#cfg.isIgnored(path)) {
          continue
        }

        // add to partition
        if (child.isDirectory) {
          nodes.push(new Dir(path))
        } else {
          files.push(new File(path))
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
