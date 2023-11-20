import * as E from "https://deno.land/x/eta@v1.12.3/mod.ts"
import { EtaConfig } from "https://deno.land/x/eta@v1.12.3/config.ts"
import { HtmlNode, HtmlElement, HtmlNodeKind as NK } from "../Html/mod.ts"
import { EventStream } from "../Events.ts"
import { TemplateEvent } from "./TemplateEvent.ts"
import { TemplatePath } from "./TemplatePath.ts"
import { TemplateHtmlCompiler, TemplateHtmlElementCompiler } from "./TemplateHtmlCompiler.ts"
import { TemplateHtml } from "./TemplateHtml.ts"
import { trim } from "../String.ts"

// -- types --
// include helper fn
type TemplateIncludeFn
  = (path: string, cfg: EtaConfig) => unknown

// frag helper fn
type TemplateFragFn
  = (child: string, parent: string, cfg: EtaConfig) => unknown

// -- constants --
const k = {
  // include helpers
  include: {
    // the base fn
    base: <TemplateIncludeFn>E.config.include!.bind(E.config),
  },
  // frag elements
  frag: {
    // the element name
    name: "w:frag",
    // the slot element/attr
    slot: "w:slot",
  }
}

// -- impls --
export class TemplateFrag {
  // -- props --
  // an event bus for template events
  #evts: EventStream<TemplateEvent>

  // -- lifetime --
  constructor(
    evts: EventStream<TemplateEvent>
  ) {
    this.#evts = evts
  }

  // -- commands --
  // a helper for including html fragments
  #frag: TemplateFragFn = (path, parent, cfg) => {
    const m = this

    // resolve path against parent
    const child = TemplatePath.resolve(path, parent)

    // send include event
    m.#evts.send(TemplateEvent.include(child, parent))

    // run original include w/ resolved path
    return k.include.base(child, cfg)
  }

  // -- factories --
  // create a template frag helper fn
  static helper(
    evts: EventStream<TemplateEvent>
  ): TemplateFragFn {
    return new TemplateFrag(evts).#frag;
  }

  // -- compiler --
  // an eta plugin that compiles build-time frag elements into helper calls
  static Compiler = class TemplateFragCompiler implements TemplateHtmlElementCompiler  {
    // -- TemplateHtmlElementCompiler --
    get names(): string[] {
      return [
        k.frag.name,
        k.frag.slot,
      ]
    }

    // compile an element
    compile(el: HtmlElement, html: TemplateHtmlCompiler): string | null {
      const m = this

      // validate el
      if (el.name !== k.frag.name) {
        return null
      }

      // validate path
      const { path, ...attrs } = el.attrs
      if (path == null) {
        throw new Error("w:frag must have a `path`")
      }

      // compile children
      if (el.children != null) {
        // split children into body and slots
        const body: HtmlNode[] = []
        for (const c of el.children) {
          // if not a slot, add to body
          if (c.kind !== NK.element || c.element.name !== k.frag.slot) {
            body.push(c)
          }
          // otherwise, compile the slot
          else {
            attrs[c.element.attrs.name] = m.#compileSlot(c.element, html)
          }
        }

        // compile body
        attrs.body = html.compile(body)
      }

      // compile into helper call
      const compiled = trim(`
        <%~
          frag("${path}.f.html", {
            ${TemplateHtml.compileAttrs(attrs)}
          })
        %>
      `)

      return compiled
    }

    // compile a slot element
    #compileSlot(el: HtmlElement, html: TemplateHtmlCompiler): string {
      // validate el
      const name = el.attrs.name
      if (name == null) {
        throw new Error("w:slot must have a `name`")
      }

      if (el.children == null) {
        throw new Error("w:slot must have `children`")
      }

      // and compile it
      return html.compile(el.children)
    }
  }
}
