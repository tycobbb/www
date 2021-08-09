import { lazy, Path } from "../../Core/mod.ts"
import { Config } from "../Config/mod.ts"

export class FileRepo {
  // -- module --
  static readonly get = lazy(() => new FileRepo())

  // -- deps --
  #cfg: Config

  // -- lifetime --
  constructor(cfg = Config.get()) {
    this.#cfg = cfg
  }

  // -- commands --
  // add a directory to the repo
  async addDir(dir: Path) {
    const dst = this.#cfg.paths.dst.resolve(dir)
    await dst.mkdir()
  }

  // add a flat file to the repo
  async addFlat(flat: Path) {
    // use absolute path for symlinks
    const p = this.#cfg.paths
    const src = p.cwd.resolve(flat)
    const dst = p.dst.resolve(flat)

    // copy the file (or symlink in dev)
    if (this.#cfg.isProd) {
      await src.copy(dst)
    } else {
      await src.symlink(dst)
    }
  }
}
