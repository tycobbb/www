import { transient, log } from "../../Core/mod.ts"
import { Pages } from "../Page/mod.ts"
import { Action } from "./Action.ts"

// compile every page (.p.html) and write them to disk
export class Build implements Action {
  // -- module --
  static readonly get = transient(() => new Build())

  // -- deps --
  #pages: Pages

  // -- lifetime --
  constructor(pages = Pages.get()) {
    this.#pages = pages
  }

  // -- commands --
  async call(): Promise<void> {
    log.d("d [build] start")
    await this.#pages.render()
  }

  // -- queries --
  get isProcess(): boolean {
    return false
  }
}
