import { Config } from "../Config/mod.ts"
import { Action } from "./Action.ts"

export class Clean implements Action {
  // -- module --
  static get get(): Clean { return new Clean() }

  // -- props --
  #cfg: Config

  // -- lifetime --
  constructor(cfg = Config.get) {
    this.#cfg = cfg
  }

  // -- commands --
  async call() {
    const dst = this.#cfg.paths.dst
    if (await dst.exists()) {
      await dst.rm()
    }
  }
}
