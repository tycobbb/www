import { log } from "../Core/mod.ts"
import { Paths, Path } from "../Domain/mod.ts"
import { Action } from "./Action.ts"

export class Build implements Action {
  // -- props --
  private paths: Paths

  // -- lifetime --
  constructor(paths: Paths) {
    this.paths = paths
  }

  // -- commands --
  async call() {
    const src = this.paths.src

    // traverse proj dir
    for await (const files of this.walk([src])) {
      for (const file of files) {
        log.debug(`- ${file.str.slice(src.length - 1)}`)
      }
    }
  }

  // -- queries --
  private async *walk(dirs: Path[]): AsyncIterable<Path[]> {
    // partition children into dirs and files
    const nodes = []
    const files = []

    for (const dir of dirs) {
      for await (const child of Deno.readDir(dir.str)) {
        // build path
        const path = dir.join(child.name)

        // add to partition
        if (child.isDirectory) {
          nodes.push(path)
        } else {
          files.push(path)
        }
      }
    }

    // yield files as a group
    if (files.length !== 0) {
      yield files
    }

    // recurse into directories
    if (nodes.length !== 0) {
      yield *this.walk(nodes)
    }
  }
}
