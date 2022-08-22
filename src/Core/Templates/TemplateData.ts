import { EventStream } from "../Events.ts"
import { TemplateEvent } from "./TemplateEvent.ts"
import { TemplatePath } from "./TemplatePath.ts"

// -- types --
// data available to templates
export type TemplateData =
  { [key: string | symbol]: unknown }

// a template data helper fn
type TemplateDataHelper
  = (path: string, parent: string) => unknown

// a factory for constructing a helper with its dependencies
type TemplateDataHelperFactory = {
  helper: (
    data: TemplateData,
    evts: EventStream<TemplateEvent>
  ) => TemplateDataHelper
}

// -- impls --
export const TemplateData: TemplateDataHelperFactory = {
  helper: (data, evts) => (path, parent) => {
    // resolve path against parent
    const child = TemplatePath.resolve(path, parent)

    // get data
    const val = data[child]
    if (val == null) {
      throw new Error(`templates missing data for "${child}"`)
    }

    // send include event
    evts.send(TemplateEvent.include(child, parent))

    return val
  },
}