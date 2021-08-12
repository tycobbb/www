import { Config } from "../../Config/mod.ts"
import { File } from "../File.ts"

// copy a flat file to its destination
export class SaveFile {
  // -- deps --
  #cfg: Config

  // -- props --
  #file: File

  // -- lifetime --
  constructor(file: File, cfg = Config.get()) {
    this.#cfg = cfg
    this.#file = file
  }

  // -- command --
  async call() {
    const dst = this.#cfg.paths.dst.resolve(this.#file.path)
    await dst.write(this.#file.text)
  }
}
