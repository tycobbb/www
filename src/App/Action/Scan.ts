import { log, Path } from "../../Core/mod.ts"
import { Config } from "../Config/mod.ts"
import { PageRepo } from "../Page/mod.ts"
import { FileEvents, FileEvent } from "../File/mod.ts"
import { Action } from "./Action.ts"
import { ProcessFile } from "./Services/mod.ts"

type NewFile = {
  kind: "dir" | "file"
  path: Path
}

export class Scan implements Action {
  // -- module --
  static get = () => new Scan()

  // -- deps --
  #cfg: Config
  #process: ProcessFile
  #evts: FileEvents

  // -- lifetime --
  constructor(
    cfg = Config.get(),
    process = ProcessFile.get(),
    evts = FileEvents.get()
  ) {
    this.#cfg = cfg
    this.#process = process
    this.#evts = evts
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
            this.#evts.add(FileEvent.copyDir(file.path)); break;
          case "file":
            this.#process.call(file.path); break;
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
