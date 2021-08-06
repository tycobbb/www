import { Config } from "../Domain/mod.ts"
import { Action } from "./Action.ts"

export class Clean implements Action {
  // -- props --
  #cfg: Config

  // -- lifetime --
  constructor(paths: Config) {
    this.#cfg = paths
  }

  // -- commands --
  async call() {
    const dst = this.#cfg.paths.dst
    if (await dst.exists()) {
      await dst.rm()
    }
  }
}
