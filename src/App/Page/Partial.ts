import { DOMParser, HTMLDocument, Element } from "https://deno.land/x/deno_dom@v0.1.13-alpha/deno-dom-wasm.ts"

// -- types --
export type Var = string | BoundPartial
export type Vars = { [key: string]: Var }
export type Compile = (vars: Vars) => string

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
  // bind the partial's variables, producing a bound copy
  bind(vars: Vars = {}): BoundPartial {
    // get document
    const $doc = this.$doc()

    // get document head
    const $head = $doc.querySelector("head")
    if ($head == null) {
      throw new Error("document was missing <head>")
    }

    // extract vars
    const $vars = this.#doc.getElementsByTagName("v$")

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
        // get the child doc
        const $child = val.$doc()

        // merge every child of the head into this document's head
        const $hcs = $child.querySelector("head")?.children || []
        for (const $hc of $hcs || []) {
          $head.appendChild($hc)
        }

        // replace the var with the children of the body
        const $bcs = $child.querySelector("body")?.children || []
        $var.replaceWith(...$bcs)
      }
    }

    return new BoundPartial(this.#doc)
  }

  // get the document element
  $doc(): Element {
    const $doc = this.#doc.documentElement
    if ($doc == null) {
      throw new Error("could not find document element")
    }

    return $doc
  }

  // -- factories --
  // parse the partial from text content
  static parse(text: string): Partial {
    // parse html
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
    return this.$doc().outerHTML
  }

  // -- queries --
  // get the document element
  $doc(): Element {
    const $doc = this.#doc.documentElement
    if ($doc == null) {
      throw new Error("could not find document element")
    }

    return $doc
  }
}
