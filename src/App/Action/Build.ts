import { transient } from "../../Core/Scope.ts"
import { Action } from "./Action.ts"
import { Pages } from "../Page/mod.ts"

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
    await this.#pages.compile()
  }

  // -- queries --
  get isProcess(): boolean {
    return false
  }
}
