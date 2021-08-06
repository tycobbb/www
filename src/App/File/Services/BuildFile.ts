import { log } from "../../../Core/mod.ts"
import { Config } from "../../Config/mod.ts"
import { File } from "../File.ts"
import { Dir } from "../Dir.ts"
import { Flat } from "../Flat.ts"

// -- impls --
export class BuildFile {
  // -- deps --
  #cfg: Config

  // -- lifetime --
  constructor(cfg: Config) {
    this.#cfg = cfg
  }

  // -- commands --
  async call(file: File) {
    log.d(`- ${file.path.str}`)

    switch (file.kind) {
      case "dir":
        await this.#addDir(file); break;
      case "flat":
        await this.#addFlat(file); break
    }
  }

  // this would be `DirRepo#add` if it were worth making
  async #addDir(dir: Dir) {
    const dst = this.#cfg.paths.dst.resolve(dir.path)
    await dst.mkdir()
  }

  // this would be `FlatRepo#add` if it were worth making
  async #addFlat(file: File) {
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
