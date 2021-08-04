import { Paths } from "../Domain/mod.ts"
import { Action } from "./Action.ts"

export class Clean implements Action {
  // -- props --
  #paths: Paths

  // -- lifetime --
  constructor(paths: Paths) {
    this.#paths = paths
  }

  // -- commands --
  async call() {
    const dst = this.#paths.dst
    if (!await dst.exists()) {
      return
    }

    await Deno.remove(dst.str, { recursive: true })
  }
}
