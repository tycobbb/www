import { EventStream } from "../Events.ts"
import { TemplateEvent } from "./TemplateEvent.ts"
import { TemplatePath } from "./TemplatePath.ts"
import { TemplateDataIndex } from "./TemplateDataIndex.ts"

// -- types --
// a template data helper fn
type TemplateDataFn
  = (path: string, parent: string) => unknown

// -- impls --
export class TemplateData {
  // -- deps --
  // the template data store
  #indx: TemplateDataIndex

  // a bus for template events
  #evts: EventStream<TemplateEvent>

  // -- props --
  // a cached list of db keys
  #keys: string[] | null = null

  // -- lifetime --
  constructor(
    db: TemplateDataIndex,
    evts: EventStream<TemplateEvent>
  ) {
    this.#indx = db
    this.#evts = evts
  }

  // -- queries --
  // get template data given a path
  #data: TemplateDataFn = (path, parent) => {
    const m = this

    // resolve path against parent
    const child = TemplatePath.resolve(path, parent)

    // get data, if any
    const val = m.#indx[child]
    if (val == null) {
      throw new Error(`no data for path "${child}"; did you mean: ${m.#findSuggestions(child)}?`)
    }

    // send include event
    m.#evts.send(TemplateEvent.include(child, parent))

    return val
  }

  // find suggested keys given a missing key
  #findSuggestions(missing: string): string[] {
    const m = this

    // lazily eval keys
    if (m.#keys == null) {
      m.#keys = Object.keys(m.#indx)
    }

    // filter to possible matches
    const suggestions = m.#keys
      .filter((k) => k.includes(missing))
      .map((k) => `"${k}"`)

    return suggestions
  }

  // -- factories --
  // create a template data helper fn
  static helper(
    indx: TemplateDataIndex,
    evts: EventStream<TemplateEvent>
  ): TemplateDataFn {
    return new TemplateData(indx, evts).#data;
  }
}