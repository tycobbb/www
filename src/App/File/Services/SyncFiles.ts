import { Path } from "../../../Core/mod.ts"
import { Config } from "../../Config/mod.ts"
import { Events } from "../../Event/mod.ts"
import { File } from "../../File/mod.ts"

// an stream of application events
export class SyncFiles {
  // -- module --
  static get = () => new SyncFiles()

  // -- deps --
  #cfg: Config
  #evts: Events

  // -- lifetime --
  constructor(
    cfg = Config.get(),
    evts = Events.get(),
  ) {
    this.#cfg = cfg
    this.#evts = evts
  }

  // -- commands --
  // starts syncing files
  start(): void {
    this.#evts.on(async (e) => {
      switch (e.kind) {
      case "copy-dir":
        await this.#copyDir(e.file.path); break
      case "copy-file":
        await this.#copyFile(e.file.path); break
      case "delete-file":
        await this.#deleteFile(e.file); break
      case "save-file":
        await this.#saveFile(e.file); break
      }
    })
  }

  // copy a dir to its dst path
  async #copyDir(file: Path) {
    const dst = this.#cfg.paths.dst.rebase(file)
    await dst.mkdir()
  }

  // copy a file to its dst path
  async #copyFile(file: Path) {
    // use absolute ref for symlinks
    const p = this.#cfg.paths
    const src = p.cwd.rebase(file)
    const dst = p.dst.rebase(file)

    // copy the file in prod
    if (this.#cfg.isProd) {
      await src.copy(dst)
    }
    // but symlink in dev
    else {
      if (await dst.exists()) {
        await dst.rm()
      }

      await src.symlink(dst)
    }
  }

  // delete a file from its dst path
  async #deleteFile(file: Path) {
    const dst = this.#cfg.paths.dst.rebase(file)
    await dst.rm()
  }

  // save a new file at its dst path
  async #saveFile(file: File) {
    const dst = this.#cfg.paths.dst.rebase(file.path)
    await dst.write(file.text)
  }
}
