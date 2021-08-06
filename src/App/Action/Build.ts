import { Config } from "../Config/mod.ts"
import { File, Dir, Flat, BuildFile } from "../File/mod.ts"
import { Action } from "./Action.ts"

export class Build implements Action {
  // -- deps --
  #cfg: Config
  #build: BuildFile

  // -- lifetime --
  constructor(cfg: Config) {
    this.#cfg = cfg
    this.#build = new BuildFile(cfg)
  }

  // -- commands --
  async call() {
    const { src, dst } = this.#cfg.paths

    // build dist dir
    await dst.mkdir()

    // construct entry point
    const root = new Dir(src)

    // traverse proj dir and build every file
    for await (const files of this.#walk([root])) {
      for (const file of files) {
        this.#build.call(file)
      }
    }
  }

  // -- queries --
  async *#walk(level: Dir[]): AsyncIterable<File[]> {
    // partition children into dirs and files
    const nodes: Dir[] = []
    const files: Flat[] = []

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
          files.push(new Flat(path))
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
