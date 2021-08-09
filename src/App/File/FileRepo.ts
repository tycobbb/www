import { lazy, Path } from "../../Core/mod.ts"
import { Config } from "../Config/mod.ts"
import { Page } from "./Page.ts"
import { Template } from "./Template.ts"

export class FileRepo {
  // -- module --
  static readonly get = lazy(() => new FileRepo())

  // -- deps --
  #cfg: Config

  // -- props --
  #pages: Page[] = []
  #templates: Template[] = []

  // -- lifetime --
  constructor(cfg = Config.get()) {
    this.#cfg = cfg
  }

  // -- commands --
  // add a directory to the repo
  async addDir(path: Path) {
    const dst = this.#cfg.paths.dst.resolve(path)
    await dst.mkdir()
  }

  // add a flat file to the repo
  async addFlat(path: Path) {
    // use absolute path for symlinks
    const p = this.#cfg.paths
    const src = p.cwd.resolve(path)
    const dst = p.dst.resolve(path)

    // copy the file (or symlink in dev)
    if (this.#cfg.isProd) {
      await src.copy(dst)
    } else {
      await src.symlink(dst)
    }
  }

  addPage(path: Path) {
    this.#pages.push(new Page(path))
  }

  addTemplate(path: Path) {
    this.#templates.push(new Template(path))
  }
}
