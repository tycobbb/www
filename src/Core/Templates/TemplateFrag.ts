import * as E from "https://deno.land/x/eta@v1.12.3/mod.ts"
import { EtaConfig } from "https://deno.land/x/eta@v1.12.3/config.ts"
import { EventStream } from "../Events.ts"
import { Html, HtmlNode, HtmlElement, HtmlNodeKind as NK } from "../Html/mod.ts"
import { TemplateEvent } from "./TemplateEvent.ts"
import { TemplatePath } from "./TemplatePath.ts"

// -- constants --
// the base include fn
const kInclude: (path: string, cfg: EtaConfig) => unknown
  = E.config.include!.bind(E.config)

// -- impls --
// create the helper from its deps
const helper = (evts: EventStream<TemplateEvent>) => (
  // a helper for including html fragments
  function frag(path: string, parent: string, cfg: EtaConfig) {
    // resolve path against parent
    const child = TemplatePath.resolve(path, parent)

    // send include event
    evts.send(TemplateEvent.include(child, parent))

    // run original include w/ resolved path
    return kInclude(child, cfg)
  }
)

// an eta plugin that compiles build-time frag elements into helper calls
class TemplateFragPlugin {
  // -- props --
  // the html parser
  #html: Html = new Html([
    "w:frag"
  ])

  // -- queries --
  // compile a list of nodes
  compile(nodes: HtmlNode[]): string {
    const m = this

    const compiled = nodes.reduce((res, node) => {
      switch (node.kind) {
      case NK.text:
        return res + node.text
      case NK.element:
        return res + m.compileEl(node.element)
      case NK.slice:
        throw new Error("found a slice in the list of html nodes")
      }
    }, "")

    return compiled
  }

  // compile an element
  compileEl(el: HtmlElement): string {
    const m = this

    // validate path
    const { path, ...attrs } = el.attrs
    if (path == null) {
      throw new Error("w:frag was missing path")
    }

    // compile children
    // TODO: this won't quite work yet...
    if (el.children != null) {
      attrs.children = m.compile(el.children)
    }

    // compile into helper call
    const compiled = `
      <%~
        frag("${path}", {
          ${Object
            .entries(attrs)
            .map(([key, val]) => `${key}: "${val}"`)
            .join(",\n")}
        })
      %>
    `

    return compiled
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

// factory for template frag helpers
export const TemplateFrag = {
  helper,
  Plugin: TemplateFragPlugin,
}