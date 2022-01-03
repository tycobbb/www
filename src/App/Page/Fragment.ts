import { Path } from "../../Core/mod.ts"
import { Partial, BoundPartial, Vars } from "./Partial.ts"

// a fragment (.f.html) that is compiled and inserted a parent
export class Fragment {
  // -- props --
  #dirty: boolean
  #partial: Partial

  // -- lifetime --
  constructor(partial: Partial) {
    this.#dirty = true
    this.#partial = partial
  }

  // -- commands --
  // mark the page as dirty
  mark() {
    if (!this.#dirty) {
      this.#dirty = true
    }
  }

  // bind the fragment, producing a bound partial
  bind(vars: Vars = {}): BoundPartial {
    this.#dirty = false

    // bind partial w/ vars
    return this.#partial.bind(vars)
  }

  // -- queries --
  // if the page is dirty
  get isDirty(): boolean {
    return this.#dirty
  }
}
