import { Action } from "./Action.ts"
import { PageGraph } from "../Page/mod.ts"

// compile every page (.p.html) and write them to disk
export class Build implements Action {
  // -- module --
  static get = () => new Build()

  // -- deps --
  #pages: PageGraph

  // -- lifetime --
  constructor(pages = PageGraph.get()) {
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
