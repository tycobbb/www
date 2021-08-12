import { Config } from "../../Config/mod.ts"
import { FileRef } from "../File.ts"

// copy a flat file to its destination
export class CopyFile {
  // -- deps --
  #cfg: Config

  // -- props --
  #ref: FileRef

  // -- lifetime --
  constructor(ref: FileRef, cfg = Config.get()) {
    this.#ref = ref
    this.#cfg = cfg
  }

  // -- command --
  async call() {
    // use absolute ref for symlinks
    const p = this.#cfg.paths
    const src = p.cwd.resolve(this.#ref)
    const dst = p.dst.resolve(this.#ref)

    // copy the file (or symlink in dev)
    if (this.#cfg.isProd) {
      await src.copy(dst)
    } else {
      await src.symlink(dst)
    }
  }
}
