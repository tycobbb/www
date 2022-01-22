import { Path } from "../../Core/mod.ts"
import { Config } from "../Config/mod.ts"
import { Event, Events } from "../Event/mod.ts"
import { FileRef } from "../File/mod.ts"
import { PageGraph } from "../Page/mod.ts"
import { Action } from "./Action.ts"

// -- types --
type NewFile = {
  path: Path
  isDirectory: boolean
}

// -- impls --
// traverse the file tree and add pages to graph
export class Scan implements Action {
  // -- module --
  static get = () => new Scan()

  // -- deps --
  #cfg: Config
  #evts: Events
  #pages: PageGraph

  // -- lifetime --
  constructor(
    cfg = Config.get(),
    evts = Events.get(),
    pages = PageGraph.get(),
  ) {
    this.#cfg = cfg
    this.#evts = evts
    this.#pages = pages
  }

  // -- commands --
  async call(): Promise<void> {
    const { src, dst } = this.#cfg.paths

    // build dist dir
    await dst.mkdir()

    // traverse proj dir and scan every file
    for await (const files of this.#walk([src])) {
      for (const f of files) {
        switch (f.kind) {
        // if this is a directory, copy it
        case "dir":
          this.#evts.add(Event.copyDir(f)); break
        // if this is a flat file, copy it
        case "file":
          this.#evts.add(Event.copyFile(f)); break
        // otherwise, add it to the graph
        default:
          this.#pages.addPathToFile(f.path); break;
        }
      }
    }
  }

  // -- queries --
  async *#walk(level: Path[]): AsyncIterable<FileRef[]> {
    // partition children into dirs and files
    const nodes: FileRef[] = []
    const files: FileRef[] = []

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
          nodes.push(new FileRef(path, "dir"))
        } else {
          files.push(new FileRef(path))
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

  get isProcess(): boolean {
    return false
  }
}
