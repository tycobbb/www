import { Config } from "../Config/mod.ts"
import { Action } from "./Action.ts"

// clean the dst directory
export class Clean implements Action {
  // -- module --
  static get = () => new Clean()

  // -- deps --
  #cfg: Config

  // -- lifetime --
  constructor(cfg = Config.get()) {
    this.#cfg = cfg
  }

  // -- commands --
  async call(): Promise<void> {
    const dst = this.#cfg.paths.dst
    if (await dst.exists()) {
      await dst.rm()
    }
  }

  // -- queries --
  get isSerial(): boolean {
    return true
  }
}
