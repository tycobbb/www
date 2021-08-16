import { lazy } from "../../../Core/mod.ts"
import { Config } from "../../Config/mod.ts"
import { FileEvent } from "../Event.ts"
import { FileRef, File } from "../File.ts"

// an event bus for file events (may also process them)
export class FileEvents {
  // -- module --
  static get = lazy(() => new FileEvents())

  // -- deps --
  #cfg: Config

  // -- lifetime --
  constructor(cfg = Config.get()) {
    this.#cfg = cfg
  }

  // -- command --
  // add a new event to the event bus
  add(evt: FileEvent) {
    this.#process(evt)
  }

  // -- c/processing
  // run the fs operation for this event
  async #process(evt: FileEvent) {
    switch (evt.kind) {
      case "copy-dir":
        await this.#copyDir(evt.file); break
      case "copy-file":
        await this.#copyFile(evt.file); break
      case "delete-file":
        await this.#deleteFile(evt.file); break
      case "save-file":
        await this.#saveFile(evt.file); break
    }
  }

  // copy a dir to its dst path
  async #copyDir(file: FileRef) {
    const dst = this.#cfg.paths.dst.rebase(file)
    await dst.mkdir()
  }

  // copy a file to its dst path
  async #copyFile(file: FileRef) {
    // use absolute ref for symlinks
    const p = this.#cfg.paths
    const src = p.cwd.rebase(file)
    const dst = p.dst.rebase(file)

    // copy the file (or symlink in dev)
    if (this.#cfg.isProd) {
      await src.copy(dst)
    } else {
      await src.symlink(dst)
    }
  }

  // delete a file from its dst path
  async #deleteFile(file: FileRef) {
    const dst = this.#cfg.paths.dst.rebase(file)
    await dst.rm()
  }

  // save a new file at its dst path
  async #saveFile(file: File) {
    const dst = this.#cfg.paths.dst.rebase(file.path)
    await dst.write(file.text)
  }
}
