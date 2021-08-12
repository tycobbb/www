import { Config } from "../../Config/mod.ts"
import { FileRef } from "../File.ts"

// copy a src dir to its destination
export class CopyDir {
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
    const dst = this.#cfg.paths.dst.resolve(this.#ref)
    await dst.mkdir()
  }
}
