import { log, Path } from "../../Core/mod.ts"
import { Config } from "../Config/mod.ts"
import { FileRepo } from "../File/mod.ts"
import { Action } from "./Action.ts"

type NewFile = {
  kind: "dir" | "flat",
  path: Path
}

export class Scan implements Action {
  // -- module --
  static get = () => new Scan()

  // -- deps --
  #cfg: Config
  #files: FileRepo

  // -- lifetime --
  constructor(cfg = Config.get(), files = FileRepo.get()) {
    this.#cfg = cfg
    this.#files = files
  }

  // -- commands --
  async call() {
    const { src, dst } = this.#cfg.paths

    // build dist dir
    await dst.mkdir()

    // traverse proj dir and scan every file
    for await (const files of this.#walk([src])) {
      for (const file of files) {
        log.d(`- ${file.path.str}`)

        switch (file.kind) {
          case "dir":
            await this.#files.addDir(file.path); break;
          case "flat":
            await this.#files.addFlat(file.path); break;
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

        // add to partition
        if (child.isDirectory) {
          nodes.push({ kind: "dir", path })
        } else {
          files.push({ kind: "flat", path })
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
