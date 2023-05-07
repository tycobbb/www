import { EtaConfig } from "https://deno.land/x/eta@v1.12.3/config.ts"
import { Html, HtmlNode, HtmlElement, HtmlNodeKind as NK } from "../Html/mod.ts"
import { TemplateHtmlCompiler, TemplateHtmlElementCompiler } from "./TemplateHtmlCompiler.ts"

// -- impls --
// an eta plugin that compiles build-time w:<html> elements into helper calls
export class TemplateHtml implements TemplateHtmlCompiler {
  // -- props --
  // the html parser
  #html: Html

  // the element compilers
  #elements: TemplateHtmlElementCompiler[]

  // -- lifetime --
  constructor(elements: TemplateHtmlElementCompiler[]) {
    this.#html = new Html(elements.flatMap((el) => el.names))
    this.#elements = elements
  }

  // -- queries --
  // compile a list of nodes
  compile(nodes: HtmlNode[]): string {
    const m = this

    const compiled = nodes.reduce((res, node) => {
      switch (node.kind) {
        case NK.text:
          return res + node.text
        case NK.element:
          return res + m.#compileElement(node.element)
      }
    }, "")

    return compiled
  }

  // compile an element
  #compileElement(el: HtmlElement): string {
    for (const element of this.#elements) {
      const compiled = element.compile(el, this)
      if (compiled != null) {
        return compiled
      }
    }

    throw new Error(`[tmpls] found no compiler for ${el.name}`)
  }

  // -- EtaPlugin --
  processTemplate(tmpl: string, _: EtaConfig): string {
    const m = this

    // decode nodes
    const nodes = m.#html.decode(tmpl)
    if (nodes == null) {
      return tmpl
    }

    // compile template
    const compiled = m.compile(nodes)
    return compiled
  }
}