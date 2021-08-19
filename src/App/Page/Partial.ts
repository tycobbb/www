import { DOMParser, HTMLDocument, Element } from "https://deno.land/x/deno_dom@v0.1.13-alpha/deno-dom-wasm.ts"
import { Path } from "../../Core/mod.ts"

// -- types --
export type Var = string | BoundPartial
export type Vars = { [key: string]: Var }

// -- impls --
// a template that can consume a partial html file, bind variables to it,
// and compile the resulting html string
export class Partial {
  // -- props --
  #doc: HTMLDocument

  // -- lifetime --
  constructor(doc: HTMLDocument) {
    this.#doc = doc
  }

  // -- commands --
  // bind the partial's variables; returns a bound instance that can be compiled
  bind(vars: Vars = {}): BoundPartial {
    // get a copy of this document
    const doc = this.#copy()

    // extract vars
    const $vars = doc.getElementsByTagName("v$")

    // substitute all vars
    for (const $var of $vars) {
      const val = vars[$var.id]

      // remove missing vars
      if (val == null) {
        $var.remove()
      }
      // directly substitute strings
      else if (typeof val === "string") {
        $var.replaceWith(val)
      }
      // merge bound partials
      else {
        // merge every child of the head into this document's head
        const $head = doc.head
        for (const $hc of val.$head.childNodes) {
          $head.appendChild($hc)
        }

        // replace the var with the children of the body
        $var.replaceWith(...val.$body.children)
      }
    }

    return new BoundPartial(doc)
  }

  // -- queries --
  // create a copy of this doc, setting some props we depend on
  #copy(): HTMLDocument {
    const d = this.#doc.cloneNode(true)
    d.head = d.getElementsByTagName("head")[0]
    d.body = d.getElementsByTagName("body")[0]
    return d
  }

  // get the document's header comment
  getHeaderComment(): string | null {
    for (const n of this.#doc.childNodes) {
      if (n.nodeType === n.COMMENT_NODE) {
        return n.textContent
      }
    }

    return null
  }

  // -- factories --
  // read a partial from the path
  static async read(path: Path): Promise<Partial> {
    const text = await path.read()
    return Partial.parse(text)
  }

  // parse the partial from text
  static parse(text: string): Partial {
    const doc = new DOMParser().parseFromString(text, "text/html")
    if (doc == null) {
      throw new Error("could not parse template")
    }

    return new Partial(doc)
  }
}

export class BoundPartial {
  // -- props --
  #doc: HTMLDocument

  // -- lifetime --
  constructor(doc: HTMLDocument) {
    this.#doc = doc
  }

  // -- commands --
  // compile the partial to a string
  compile(): string {
    const $doc = this.#doc.documentElement
    if ($doc == null) {
      throw new Error("could not find document element")
    }

    return $doc.outerHTML
  }

  // -- queries --
  // get the partial's head element
  get $head(): Element {
    return this.#doc.head
  }

  // get the partial's body element
  get $body(): Element {
    return this.#doc.body
  }
}
