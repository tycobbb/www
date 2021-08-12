import {
  DOMParser,
  HTMLDocument
} from "https://deno.land/x/deno_dom@v0.1.13-alpha/deno-dom-wasm.ts"

// -- types --
export type Vars = { [key: string]: string }
export type Compile = (vars: Vars) => string

// -- impls --
// a template that can consume a partial html file, bind variables to it,
// and compile the resulting html string
export class Partial {
  // -- props --
  #compile: Compile

  // -- lifetime --
  constructor(compile: Compile) {
    this.#compile = compile
  }

  // -- commands --
  // compile the template to a string, substituting any vars
  compile(vars: Vars): string {
    return this.#compile(vars)
  }

  // -- factories --
  // parse the partial from text content
  //
  // - arguments:
  //   - text: the text content to parse
  //   - prepare: a fn to modify the doc just after parsing
  //
  // - returns: a parsed template
  static parse(
    text: string,
    prepare: ((doc: HTMLDocument) => void) | null = null
  ): Partial {
    // parse html
    const doc = new DOMParser().parseFromString(text, "text/html")
    if (doc == null) {
      throw new Error("could not parse template")
    }

    // prepare the document, if necessary
    if (prepare != null) {
      prepare(doc)
    }

    // extract vars
    const $vars = doc.getElementsByTagName("v$")

    // build template
    return new Partial((vars) => {
      // substitute all vars
      for (const $var of $vars) {
        const val = vars[$var.id]

        if (val == null) {
          $var.remove()
        } else {
          $var.replaceWith(val)
        }
      }

      // convert to string
      const $doc = doc.documentElement
      if ($doc == null) {
        throw new Error("could not find document element")
      }

      return $doc.outerHTML
    })
  }
}
