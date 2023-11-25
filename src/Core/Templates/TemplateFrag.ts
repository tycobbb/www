import * as E from "https://deno.land/x/eta@v1.12.3/mod.ts"
import { EtaConfig } from "https://deno.land/x/eta@v1.12.3/config.ts"
import { HtmlNode, HtmlElement, HtmlNodeKind as NK } from "../Html/mod.ts"
import { EventStream } from "../Events.ts"
import { TemplateEvent } from "./TemplateEvent.ts"
import { TemplatePath } from "./TemplatePath.ts"
import { TemplateHtmlCompiler, TemplateHtmlElementCompiler } from "./TemplateHtmlCompiler.ts"
import { TemplateHtml } from "./TemplateHtml.ts"
import { trim } from "../String.ts"
import { HtmlElementNode } from "../Html/Html.ts";

// -- types --
// include helper fn
type TemplateIncludeFn
  = (path: string, cfg: EtaConfig) => unknown

// frag helper fn
type TemplateFragFn
  = (child: string, parent: string, cfg: EtaConfig) => unknown

// a compiled fragment slot
interface TemplateFragSlot {
  name: string,
  body: string
}

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

      // ignore non-fragments
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
        const body: HtmlNode[] = []
        for (const node of el.children) {
          // if the child is a slot, precompile it
          let slot: TemplateFragSlot | null = null
          if (node.kind === NK.element) {
            const el = node.element
            if (el.name === k.frag.slot) {
              slot = m.#compileSlotFromEl(node, html)
            } else if (el.attrs[k.frag.slot] != null) {
              slot = m.#compileSlotFromAttr(node, html)
            }
          }

          // add any slots as attributes
          if (slot != null) {
            attrs[slot.name] = slot.body
          }
          // but otherwise assemble the body
          else {
            body.push(node)
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
    #compileSlotFromEl(node: HtmlElementNode, html: TemplateHtmlCompiler): TemplateFragSlot {
      const el = node.element

      // validate el
      const name = el.attrs.name
      if (name == null || name.length === 0) {
        throw new Error("w:slot must have a `name`")
      }

      if (el.children == null) {
        throw new Error("w:slot must have `children`")
      }

      // and compile it
      return {
        name,
        body: html.compile(el.children)
      }
    }

    #compileSlotFromAttr(node: HtmlElementNode, html: TemplateHtmlCompiler): TemplateFragSlot {
      const el = node.element

      // validate el
      const name = el.attrs[k.frag.slot]
      if (name == null || name.length === 0) {
        throw new Error("w:slot must have a `name`")
      }

      // remove the slot attribute
      delete el.attrs[k.frag.slot]

      // and compile it
      return {
        name,
        body: html.compile([node])
      }
    }
  }
}
