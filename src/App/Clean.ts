import { exists } from "https://deno.land/std@0.100.0/fs/mod.ts"
import { Paths } from "../Domain/mod.ts"
import { Action } from "./Action.ts"

export class Clean implements Action {
  // -- props --
  private paths: Paths

  // -- lifetime --
  constructor(paths: Paths) {
    this.paths = paths
  }

  // -- commands --
  async call() {
    const dst = this.paths.dst
    if (!await exists(dst)) {
      return
    }

    await Deno.remove(dst, {
      recursive: true
    })
  }
}
