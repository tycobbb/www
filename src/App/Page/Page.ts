import { Path } from "../../Core/mod.ts"
import { File } from "../File/mod.ts"
import { Layout } from "./Layout.ts"
import { Partial, Vars } from "./Partial.ts"

// a page (.p.html) that is compiled and inserted into a layout
export class Page {
  // -- props --
  #path: Path
  #layout: Layout
  #dirty: boolean
  #partial: Partial

  // -- lifetime --
  constructor(path: Path, partial: Partial, layout: Layout) {
    this.#path = path
    this.#layout = layout
    this.#dirty = true
    this.#partial = partial
  }

  // -- commands --
  // mark the page as dirty
  mark() {
    this.#dirty = true
  }

  // mark the page if the layout is dirty
  inferMarkFromParent() {
    if (this.#layout.isDirty) {
      this.mark()
    }
  }

  // rebuild the page's partial and layout
  rebuild(partial: Partial, layout: Layout) {
    this.#layout = layout
    this.#partial = partial
  }

  // compile the page, producing a `File`
  compile(vars: Vars = {}): File {
    this.#dirty = false

    // bind page and compile into layout
    const body = this.#partial.bind(vars)
    const text = this.#layout.compile({ body })

    // strip type from extension (e.g. .p.html > .html)
    const parts = this.#path.components()
    if (parts == null) {
      throw new Error("file must have a path and extension")
    }

    let [seg, ext] = parts
    ext = ext.split(".").slice(-1)[0]
    const path = this.#path.set(`${seg}.${ext}`)

    // produce file
    return { path, text }
  }

  // -- queries --
  // if the page is dirty
  get isDirty(): boolean {
    return this.#dirty
  }
}
