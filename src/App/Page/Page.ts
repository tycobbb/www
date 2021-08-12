import { Path } from "../../Core/mod.ts"
import { Config } from "../Config/mod.ts"
import { File } from "../File/mod.ts"
import { PageRepo } from "./Services/mod.ts"
import { Layout } from "./Layout.ts"
import { Partial, Vars } from "./Partial.ts"

// -- constants --
const kLayoutPattern = /^\s*<!--\s*layout:\s*(\S+)\s*-->\n/

// -- impls --
// a page (.p.html) that is compiled and inserted into a layout
export class Page {
  // -- props --
  #path: Path
  #layout: Layout | null = null
  #partial: Partial | null = null

  // -- lifetime --
  constructor(path: Path) {
    this.#path = path
  }

  // -- commands --
  async parse(cfg = Config.get(), files = PageRepo.get()) {
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
    this.#partial = Partial.parse(text, (doc) => {
      // for any body elements
      for (const $body of doc.getElementsByTagName("body")) {
        const $parent = $body.parentNode
        if ($parent == null) {
          throw new Error(`${this.#path}: body had no parent`)
        }

        // move all of its children into the parent
        for (const $child of $body.children) {
          $parent.insertBefore($child, $body)
        }

        // and remove the body
        $body.remove()
      }
    })
  }

  compile(vars: Vars = {}): File {
    if (this.#partial == null || this.#layout == null) {
      throw new Error("must `parse` page before compiling")
    }

    // compile layout & page
    const text = this.#layout.compile({
      body: this.#partial.compile(vars)
    })

    // strip type from extension (e.g. .p.html > .html)
    const parts = this.#path.components()
    if (parts == null) {
      throw new Error("file must have a path and extension")
    }

    let [seg, ext] = parts
    ext = ext.split(".").slice(-1)[0]
    const path = this.#path.set(`${seg}.${ext}`)

    return { path, text }
  }
}
