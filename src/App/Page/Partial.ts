import { DOMParser, HTMLDocument, Element, Node } from "https://deno.land/x/deno_dom@v0.1.21-alpha/deno-dom-wasm.ts"
import { Path } from "../../Core/mod.ts"

// -- types --
export type Var = string | BoundPartial
export type Vars = { [key: string]: Var }

// -- constants --
// matches simple params, "{foo}"
const kParamPattern = /{([\w_-]+)}/g

// -- impls --
// a template that can consume a partial html file, bind variables to it,
// and compile the resulting html string
export class Partial {
  // -- props --
  // the unbound html string
  #raw: string

  // -- lifetime --
  constructor(raw: string) {
    this.#raw = raw
  }

  // -- queries --
  // match a pattern against the partial's raw text
  match(pattern: RegExp): RegExpMatchArray | null {
    return this.#raw.match(pattern)
  }

  // bind the partial's variables; returns a bound instance that can be compiled
  bind(vars: Vars = {}): BoundPartial {
    // gather new head nodes
    const $headNodes: Node[] = []

    // replace simple params, "{foo}"
    const text = this.#raw.replaceAll(kParamPattern, (_, param) => {
      // get the variable value
      const val = vars[param]

      // remove missing vars
      if (val == null) {
        return ""
      }
      // directly substitute strings
      else if (typeof val === "string") {
        return val
      }
      // merge bound partials
      else {
        $headNodes.push(...val.$head.childNodes)
        return val.$body.innerHTML
      }
    })

    // parse the document
    const doc = new DOMParser().parseFromString(text, "text/html")
    if (doc == null) {
      throw new Error("could not parse template")
    }

    // append and new head elements
    for (const $node of $headNodes) {
      doc.head.appendChild($node)
    }

    // TODO: also replace slots
    return new BoundPartial(doc)
  }

  // -- factories --
  // read a partial from the path
  static async read(path: Path): Promise<Partial> {
    const text = await path.read()
    return new Partial(text)
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
  // get the partial's head el
  get $head(): Element {
    return this.#doc.head
  }

  // get the partial's body el
  get $body(): Element {
    return this.#doc.body
  }
}