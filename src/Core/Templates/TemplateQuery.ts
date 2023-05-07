import { EventStream } from "../Events.ts"
import { TemplateEvent } from "./TemplateEvent.ts"
import { TemplatePath } from "./TemplatePath.ts"

// -- types --
// a template query helper fn
type TemplateQueryFn
  = (path: string, parent: string) => unknown

// page data available to templates
export type TemplatePageDb =
  unknown

// -- impls --
// TODO: this should probably leverage a lot of what's happening in TempalteFrag
// to achieve an html-like syntax for the query:
//
// <w:query path="posts/*">
//   <%= it.name %>
// </w:query>
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
}