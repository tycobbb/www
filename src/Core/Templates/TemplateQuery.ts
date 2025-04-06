import { EventStream } from "../Events.ts"
import { HtmlElement } from "../Html/mod.ts";
import { TemplateEvent } from "./TemplateEvent.ts"
import { TemplateHtml } from "./TemplateHtml.ts";
import { TemplateHtmlCompiler, TemplateHtmlElementCompiler } from "./TemplateHtmlCompiler.ts"
import { TemplateQueryMatch } from "./TemplateQueryMatch.ts";
import { TemplateDataIndex } from "./TemplateDataIndex.ts";
import { TemplateCache } from "./TemplateCache.ts";
import { TemplatePath } from "./TemplatePath.ts";

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
interface TemplateQueryFn {
  (path: string, parent: string, attrs: TemplateQueryAttrs): unknown
}

// a map of attrs passed to the tempalte query fn
interface TemplateQueryAttrs {
  body: string
}

// -- impls --
export class TemplateQuery {
  // -- deps --
  // the template data store
  #data: TemplateDataIndex

  // finds all matching paths for a query
  #match: TemplateQueryMatch

  // a cache for storing and rendering stored templates
  #cache: TemplateCache

  // a bus for template events
  #evts: EventStream<TemplateEvent>

  // -- lifetime --
  constructor(
    data: TemplateDataIndex,
    match: TemplateQueryMatch,
    cache: TemplateCache,
    evts: EventStream<TemplateEvent>
  ) {
    this.#data = data
    this.#match = match
    this.#cache = cache
    this.#evts = evts
  }

  // -- queries --
  // get template match given a path
  #query: TemplateQueryFn = (query, parent, attrs) => {
    const m = this

    // resolve query against parent path
    query = TemplatePath.resolve(query, parent)

    // send query event
    m.#evts.send(TemplateEvent.query(query, parent))

    // compile the child template if necessary
    m.#cache.addChild(parent, query, attrs.body)

    // render matches with available data
    let rendered = ""

    const paths = m.#match(query)
    for (const path of paths) {
      const data = m.#data.pages[path]
      rendered += m.#cache.renderChild(parent, query, data)
    }

    return rendered
  }

  // -- factories --
  // create a template match helper fn
  static helper(
    data: TemplateDataIndex,
    match: TemplateQueryMatch,
    cache: TemplateCache,
    evts: EventStream<TemplateEvent>
  ): TemplateQueryFn {
    return new TemplateQuery(data, match, cache, evts).#query
  }

  // -- compiler --
  // an eta plugin that compiles build-time query elements into helper calls
  static Compiler = class TemplateQueryCompiler implements TemplateHtmlElementCompiler {
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
      if (el.children == null) {
        throw new Error("w:query must have children")
      }

      // store body as an attr to render for each child
      attrs.body = html.compile(el.children)

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