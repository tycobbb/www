import { HtmlElement, HtmlNodeKind } from "../Html/mod.ts";
import { TemplateHtmlCompiler, TemplateHtmlElementCompiler } from "./TemplateHtmlCompiler.ts"


// -- constants --
const k = {
  // the element name
  name: "w:template",
  // a pattern for trimmable whitespace
  trim: /^\n *$/
}

// -- types --
import NK = HtmlNodeKind

// -- impls --
export class TemplateRoot {
  // -- compiler --
  // a compile for <w:template> elements
  static Compiler = class TemplateRotCompiler implements TemplateHtmlElementCompiler  {
    // compile an element
    compile(el: HtmlElement, html: TemplateHtmlCompiler): string | null {
      // validate el
      if (el.name !== k.name) {
        return null
      }

      // compile children
      if (el.children == null) {
        throw new Error("w:template must have children")
      }

      // trim leading/trailing whitespace inside template
      let src = 0
      let dst = el.children.length

      let child = el.children[src]
      if (child.kind === NK.text && child.text.match(k.trim)) {
        src += 1
      }

      child = el.children[dst - 1]
      if (child.kind === NK.text && child.text.match(k.trim)) {
        dst -= 1
      }

      return html.compile(el.children.slice(src, dst))
    }
  }
}