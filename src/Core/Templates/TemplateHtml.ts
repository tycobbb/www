import { EtaConfig } from "https://deno.land/x/eta@v1.12.3/config.ts"
import { Html, HtmlNode, HtmlElement, HtmlNodeKind as NK, HtmlElementAttrs } from "../Html/mod.ts"
import { TemplateHtmlCompiler, TemplateHtmlElementCompiler } from "./TemplateHtmlCompiler.ts"
import { trim } from "../String.ts";

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
    this.#html = new Html()
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
    const m = this

    // try the element-specific compilers
    for (const element of m.#elements) {
      const compiled = element.compile(el, this)
      if (compiled != null) {
        return compiled
      }
    }

    // if none apply, compile as a raw element
    const open = trim(`
      <${el.name}
        ${
          Object
            .keys(el.attrs)
            .map((name) => `${name}="${el.attrs[name]}"`)
            .join(" ")
        }
      >
    `)

    // this is a void tag
    if (el.children == null) {
      return open
    }

    // this is not a void tag
    return `${open}${m.compile(el.children)}</${el.name}>`
  }

  // -- helpers --
  /// compile element attributes into a js-object key-value pairs
  static compileAttrs(attrs: HtmlElementAttrs) {
    const result = Object
      .entries(attrs)
      .map(([key, val]) => `${key}: "${JSON.stringify(val).slice(1, -1)}"`)
      .join(",\n")

    return result
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