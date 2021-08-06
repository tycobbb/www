import { log } from "../Core/mod.ts"
import { Config, File, Dir } from "../Domain/mod.ts"
import { Entry } from "./Entry.ts"

// -- impls --
export class BuildOne {
  // -- deps --
  #cfg: Config

  // -- lifetime --
  constructor(cfg: Config) {
    this.#cfg = cfg
  }

  // -- commands --
  async call(entry: Entry) {
    log.debug(`- ${entry.path.str}`)

    switch (entry.kind) {
      case "dir":
        await this.#addDir(entry); break;
      case "file":
        await this.#addFile(entry); break
    }
  }

  // this would be `DirRepo#add` if it were worth making
  async #addDir(dir: Dir) {
    const dst = this.#cfg.paths.dst.resolve(dir.path)
    await dst.mkdir()
  }

  // this would be `FileRepo#add` if it were worth making
  async #addFile(file: File) {
    // use absolute path for symlinks
    const p = this.#cfg.paths
    const src = p.cwd.resolve(file.path)
    const dst = p.dst.resolve(file.path)

    // copy the file (or symlink in dev)
    if (this.#cfg.isProd) {
      await src.copy(dst)
    } else {
      await src.symlink(dst)
    }
  }
}
