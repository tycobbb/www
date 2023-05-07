import { EventStream } from "../Events.ts"
import { TemplateEvent } from "./TemplateEvent.ts"
import { TemplatePath } from "./TemplatePath.ts"
import { TemplateHtmlCompiler, TemplateHtmlElementCompiler } from "./TemplateHtmlCompiler.ts"
import { HtmlElement } from "../Html/mod.ts";
import { TemplateHtml } from "./TemplateHtml.ts";

// -- constants --
const k = {
  // query elements
  query: {
    // the element name
    name: "w:query",
  }
}

// -- types --
// a template query helper fn
type TemplateQueryFn
  = (path: string, parent: string) => unknown

// page data available to templates
export type TemplatePageDb =
  unknown

// -- impls --
export class TemplateQuery {
  // -- deps --
  // the template page data store
  #db: TemplatePageDb

  // an event bus for template events
  #evts: EventStream<TemplateEvent>

  // -- lifetime --
  constructor(
    db: TemplatePageDb,
    evts: EventStream<TemplateEvent>
  ) {
    this.#db = db
    this.#evts = evts
  }

  // -- queries --
  // get template data given a path
  #query: TemplateQueryFn = (path, parent) => {
    const m = this

    // resolve query against parent
    const query = TemplatePath.resolve(path, parent)

    // send query event
    m.#evts.send(TemplateEvent.query(query, parent))

    return ""
  }

  // -- factories --
  // create a template data helper fn
  static helper(
    db: TemplatePageDb,
    evts: EventStream<TemplateEvent>
  ): TemplateQueryFn {
    return new TemplateQuery(db, evts).#query;
  }

  // -- compiler --
  // an eta plugin that compiles build-time query elements into helper calls
  static Compiler = class TemplateQueryCompiler implements TemplateHtmlElementCompiler  {
    // -- TemplateHtmlElementCompiler --
    get names(): string[] {
      return [
        k.query.name,
      ]
    }

    // compile an element
    compile(el: HtmlElement, html: TemplateHtmlCompiler): string | null {
      // validate el
      if (el.name !== k.query.name) {
        return null
      }

      // validate path
      const { path, ...attrs } = el.attrs
      if (path == null) {
        throw new Error("w:query must have a `path`")
      }

      // compile children
      if (el.children != null) {
        attrs.body = html.compile(el.children)
      }

      // compile into helper call
      const compiled = `
        <%~
          query("${path}", {
            ${TemplateHtml.compileAttrs(attrs)}
          })
        %>
      `

      return compiled
    }
  }
}