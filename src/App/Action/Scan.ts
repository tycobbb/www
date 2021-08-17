import { Path } from "../../Core/mod.ts"
import { Config } from "../Config/mod.ts"
import { PageGraph } from "../Page/mod.ts"
import { Action } from "./Action.ts"

type NewFile = {
  kind: "dir" | "file"
  path: Path
}

export class Scan implements Action {
  // -- module --
  static get = () => new Scan()

  // -- deps --
  #cfg: Config
  #pages: PageGraph

  // -- lifetime --
  constructor(
    cfg = Config.get(),
    pages = PageGraph.get(),
  ) {
    this.#cfg = cfg
    this.#pages = pages
  }

  // -- commands --
  async call() {
    const { src, dst } = this.#cfg.paths

    // build dist dir
    await dst.mkdir()

    // traverse proj dir and scan every file
    for await (const files of this.#walk([src])) {
      for (const file of files) {
        const path = file.path

        // if this is a directory, copy it
        if (file.kind == "dir") {
          this.#pages.addPathToDir(path)
        } else {
          this.#pages.addPathToFile(path)
        }
      }
    }
  }

  // -- queries --
  async *#walk(level: Path[]): AsyncIterable<NewFile[]> {
    // partition children into dirs and files
    const nodes: NewFile[] = []
    const files: NewFile[] = []

    // for each dir in the level
    for (const dir of level) {
      // for each dir child
      for await (const child of dir.children()) {
        // if not ignored
        const path = dir.join(child.name)
        if (this.#cfg.isIgnored(path)) {
          continue
        }

        // partition files and directories
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
      yield *this.#walk(nodes.map((f) => f.path))
    }
  }
}
