import { Path } from "../../Core/mod.ts"
import { Config } from "../Config/mod.ts"
import { File } from "../File/mod.ts"
import { Layout } from "./Layout.ts"
import { Partial, Vars } from "./Partial.ts"
import { PageGraph } from "./PageGraph.ts"

// -- constants --
const kLayoutPattern = /^\s*<!--\s*layout:\s*(\S+)\s*-->\n/

// -- impls --
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

  // parse the page, matching it to a layout. throws if no layout exists.
  async parse(cfg = Config.get(), files = PageGraph.get()) {
    // read file to string
    const text = await this.#path.read()

    // find the layout
    this.#layout = (() => {
      let path: Path

      // extract the layout path, if any, from the file
      const match = text.match(kLayoutPattern) || []
      if (match != null && match.length == 2) {
        path = cfg.paths.src.join(match[1])
      } else {
        path = cfg.paths.layout
      }

      // find the layout
      return files.findLayoutByPath(path)
    })()

    // parse the partial
    this.#partial = Partial.parse(text)
  }

  // compile the page, producing a `File`
  compile(vars: Vars = {}): File {
    if (this.#partial == null || this.#layout == null) {
      throw new Error("must `parse` page before compiling")
    }

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
