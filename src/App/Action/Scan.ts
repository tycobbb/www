import { log, Path } from "../../Core/mod.ts"
import { Config } from "../Config/mod.ts"
import { PageRepo } from "../Page/mod.ts"
import { CopyDir, CopyFile } from "../File/mod.ts"
import { Action } from "./Action.ts"

type NewFile = {
  kind: "dir" | "flat" | "page" | "layout",
  path: Path
}

export class Scan implements Action {
  // -- module --
  static get = () => new Scan()

  // -- deps --
  #cfg: Config
  #files: PageRepo

  // -- lifetime --
  constructor(cfg = Config.get(), files = PageRepo.get()) {
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
            await new CopyDir(file.path).call(); break;
          case "flat":
            await new CopyFile(file.path).call(); break;
            case "page":
            // TODO: probably makes more sense to add stuff to a PageGraph than
            // to a repo at this stage, so we can resolve components later. it's
            // a factory for pages basically.
            this.#files.addPage(file.path); break;
          case "layout":
            this.#files.addLayout(file.path); break;
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

        // partition directories
        if (child.isDirectory) {
          nodes.push({ kind: "dir", path })
          continue
        }

        // otherwise partition based on file extension
        const ext = path.extension()
        switch (ext) {
          case ".p.html":
            files.push({ kind: "page", path }); break
          case ".l.html":
            files.push({ kind: "layout", path }); break
          default:
            files.push({ kind: "flat", path }); break
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
